import { Content, TextContent } from '@/lib/backend/content'
import {
  ChatHistory,
  IntegrationApi,
  ModelResponse,
} from '@/lib/backend/integrations/interface'
import { StaticContent } from '@/lib/backend/static'
import { ApiResponseError, ValidationError } from '@/lib/error'
import {
  Content as ApiContent,
  getReasoningEffort,
  ModelInfo,
  ModelOptions,
} from '@/lib/frontend/shared'
import OpenAI from 'openai'

/**
 * OpenAI does not return human-readable names to its models, so we pretty them
 * up a little bit for the UI.
 */
function slugToTitle(modelId: string): string {
  return modelId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

async function contentToOpenAI(
  content: Content,
): Promise<OpenAI.Responses.ResponseInputContent> {
  const inner = content.inner()
  if (inner instanceof TextContent) {
    return { type: 'input_text', text: content.text || '' }
  } else if (inner instanceof StaticContent) {
    const data = (await inner.read()).toString('base64')
    return {
      type: 'input_image',
      detail: 'auto',
      image_url: `data:${inner.mimeType};base64,${data}`,
    }
  } else {
    throw new Error('unreachable')
  }
}

export type OpenAiFlavor = 'openai' | 'deepseek'

type ReasoningConfig = NonNullable<
  OpenAI.Responses.ResponseCreateParamsStreaming['reasoning']
>
type ReasoningEffort = NonNullable<ReasoningConfig['effort']>

/**
 * Builds a reasoning input item for replaying the reasoning of a previous
 * model turn. Must be immediately followed by its assistant message.
 */
function reasoningInputItem(
  thoughts: string,
  index: number,
): OpenAI.Responses.ResponseReasoningItem {
  // The `summary` field is display-only and not visible to the model - the
  // reasoning text content is what gets replayed into the model's context.
  return {
    type: 'reasoning',
    id: `rs_history_${index}`,
    summary: [],
    content: [{ type: 'reasoning_text', text: thoughts }],
  }
}

async function mapHistory(
  history: ChatHistory,
): Promise<OpenAI.Responses.ResponseInput> {
  const input: OpenAI.Responses.ResponseInput = []

  for (const [index, entry] of history.entries()) {
    if (entry.role === 'model') {
      // Assistant messages only support text content. Text and thought
      // content are collected separately so that the reasoning can be
      // replayed as a reasoning item.
      const textParts: string[] = []
      const thoughtParts: string[] = []
      for (const content of entry.content) {
        const inner = content.inner()
        if (inner instanceof TextContent) {
          if (inner.isThought) {
            thoughtParts.push(inner.text)
          } else {
            textParts.push(inner.text)
          }
        } else {
          throw new ValidationError(
            'OpenAI does not support images in model messages',
          )
        }
      }

      const textContent = textParts
        .filter(text => text.length > 0)
        .join('\n')
      const thoughts = thoughtParts
        .filter(text => text.length > 0)
        .join('\n')

      if (textContent.length === 0) {
        // A reasoning item must be followed by its assistant message, so
        // turns without any text are skipped entirely.
        continue
      }

      if (thoughts.length > 0) {
        input.push(reasoningInputItem(thoughts, index))
        input.push({
          type: 'message',
          role: 'assistant',
          id: `msg_history_${index}`,
          status: 'completed',
          content: [
            { type: 'output_text', text: textContent, annotations: [] },
          ],
        })
      } else {
        input.push({
          role: 'assistant',
          content: textContent,
        })
      }
    } else {
      // entry.role === 'user'
      const content = await Promise.all(entry.content.map(contentToOpenAI))
      input.push({
        role: 'user',
        content,
      })
    }
  }

  return input
}

export default class OpenAiApi implements IntegrationApi {
  private client: OpenAI
  private flavor: OpenAiFlavor

  constructor(
    apiKey: string,
    baseUrl?: string | null,
    flavor: OpenAiFlavor = 'openai',
  ) {
    this.client = new OpenAI({ baseURL: baseUrl, apiKey })
    this.flavor = flavor
  }

  async listModels(): Promise<ModelInfo[]> {
    const response = await this.client.models.list()
    return response.data.map(model => ({
      name: model.id,
      displayName: slugToTitle(model.id),
    }))
  }

  /**
   * Maps the application's reasoning effort setting onto the Responses API's
   * reasoning configuration. Returns null when reasoning should be left at
   * the model's default.
   */
  private makeReasoningConfig(
    options: ModelOptions,
  ): ReasoningConfig | null {
    const effort = getReasoningEffort(options)
    if (effort === null) {
      return null
    }

    let mapped: ReasoningEffort
    if (effort === 'none') {
      // The Responses API has no 'none' effort. DeepSeek does not support
      // 'minimal', so fall back to 'low' there.
      mapped = this.flavor === 'deepseek' ? 'low' : 'minimal'
    } else if (effort === 'xhigh') {
      // The Responses API tops out at 'high'.
      mapped = 'high'
    } else {
      mapped = effort
    }

    if (this.flavor === 'deepseek') {
      // DeepSeek accepts `summary` but never generates summaries.
      return { effort: mapped }
    }
    return { effort: mapped, summary: 'auto' }
  }

  private async makeRequestConfig(
    history: ChatHistory,
    options: ModelOptions,
  ): Promise<OpenAI.Responses.ResponseCreateParamsStreaming> {
    const input = await mapHistory(history)

    const requestConfig: OpenAI.Responses.ResponseCreateParamsStreaming = {
      model: options.model,
      input,
      temperature: options.temperature,
      stream: true,
    }

    if (options.systemPrompt) {
      requestConfig.instructions = options.systemPrompt
    }

    if (this.flavor === 'openai') {
      // The application manages conversation state itself, so there is no
      // reason to keep responses stored on OpenAI's side.
      requestConfig.store = false
    }

    const reasoning = this.makeReasoningConfig(options)
    if (reasoning) {
      requestConfig.reasoning = reasoning
    }

    return requestConfig
  }

  private makeModelResponse(
    text: string,
    thoughts?: string | null,
  ): ModelResponse {
    const content: ApiContent[] = [
      {
        type: 'text',
        text,
      },
    ]
    if (thoughts) {
      content.push({
        type: 'thought',
        text: thoughts,
      })
    }
    return { content }
  }

  async *generateStreaming(
    history: ChatHistory,
    options: ModelOptions,
    signal?: AbortSignal,
  ): AsyncIterable<ModelResponse> {
    const config = await this.makeRequestConfig(history, options)
    const stream = this.client.responses.stream(config, { signal })

    // Reasoning summaries are preferred (e.g. OpenAI), but some providers
    // only expose the raw reasoning text (e.g. DeepSeek).
    let text = ''
    let summary = ''
    let reasoning = ''

    for await (const event of stream) {
      switch (event.type) {
        case 'response.output_text.delta':
          text += event.delta
          break
        case 'response.reasoning_summary_text.delta':
          summary += event.delta
          break
        case 'response.reasoning_text.delta':
          reasoning += event.delta
          break
        case 'response.refusal.delta':
          text += event.delta
          break
        case 'response.completed':
          console.dir(event.response.usage, { depth: null })
          break
        case 'response.failed':
        case 'response.incomplete':
        case 'error':
          throw new ApiResponseError()
      }

      yield this.makeModelResponse(text, summary || reasoning)
    }
  }
}
