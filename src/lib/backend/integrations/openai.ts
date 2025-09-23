import { ChatHistory, IntegrationApi, ModelResponse } from "@/lib/backend/integrations/interface"
import { ModelInfo, ModelOptions, Content as ApiContent } from "@/lib/frontend/api"
import { ValidationError } from "@/lib/error"
import { Content, TextContent } from "@/lib/backend/content"
import { StaticContent } from "@/lib/backend/static"
import OpenAI from "openai"

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

async function contentToOpenAI(content: Content): Promise<OpenAI.Chat.Completions.ChatCompletionContentPart> {
  const inner = content.inner()
  if (inner instanceof TextContent) {
    return { type: 'text', text: content.text || '' }
  } else if (inner instanceof StaticContent) {
    const data = (await inner.read()).toString('base64')
    return {
      type: 'image_url',
      image_url: {
        url: `data:${inner.mimeType};base64,${data}`
      }
    }
  } else {
    throw new Error('unreachable')
  }
}

async function mapHistory(history: ChatHistory): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]> {
  return Promise.all(history.map(async entry => {
    if (entry.role === 'model') {
      // For assistant messages, OpenAI only supports text content.
      // Combine all text content into a single string.
      const textContent = entry.content
        .map(content => {
          const inner = content.inner()
          if (inner instanceof TextContent) {
            return inner.text
          } else {
            throw new ValidationError("OpenAI does not support images in model messages")
          }
        })
        .filter(text => text.length > 0)
        .join('\n')

      return {
        role: 'assistant',
        content: textContent
      }
    } else { // entry.role === 'user'
      const content = await Promise.all(entry.content.map(contentToOpenAI))
      return {
        role: 'user',
        content: content
      }
    }
  }))
}

export default class OpenAiApi implements IntegrationApi {
  private client: OpenAI

  constructor(apiKey: string, baseUrl?: string | null) {
    this.client = new OpenAI({ baseURL: baseUrl, apiKey })
  }

  async listModels(): Promise<ModelInfo[]> {
    const response = await this.client.models.list()
    return response.data.map(model => ({
      name: model.id,
      displayName: slugToTitle(model.id)
    }))
  }

  async generate(history: ChatHistory, options: ModelOptions, signal?: AbortSignal): Promise<ModelResponse> {
    const messages = await mapHistory(history)

    if (options.systemPrompt) {
      messages.unshift({
        role: 'system',
        content: options.systemPrompt
      })
    }

    const requestConfig: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming = {
      model: options.model,
      messages,
      temperature: options.temperature,
      stream: true,
    }

    if (options.thinkingEnabled) {
      // @ts-expect-error Nonstandard extension
      requestConfig.enable_thinking = true
    } else {
      requestConfig.reasoning_effort = 'minimal'
    }

    const response = await this.client.chat.completions.create(requestConfig, { signal })

    let thoughts = ''
    let text = ''

    // Iterate over the response stream to collect text and reasoning parts
    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta
      if (!delta) continue

      if (delta.content) {
        text += delta.content
      }

      // @ts-expect-error Nonstandard extension
      if (delta.reasoning_content) {
        // @ts-expect-error Nonstandard extension
        thoughts += delta.reasoning_content
      }
    }

    // OpenAI's stateless API does not support image outputs - perhaps a
    // deliberate choice to encourage vendor lock-in.
    const content: ApiContent[] = [{
      type: 'text',
      text,
    }]
    if (thoughts) {
      content.push({
        type: 'thought',
        text: thoughts,
      })
    }
    console.dir(content, { depth: null })

    return { content }
  }
}