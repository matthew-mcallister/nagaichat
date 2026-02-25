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
): Promise<OpenAI.Chat.Completions.ChatCompletionContentPart> {
  const inner = content.inner()
  if (inner instanceof TextContent) {
    return { type: 'text', text: content.text || '' }
  } else if (inner instanceof StaticContent) {
    const data = (await inner.read()).toString('base64')
    return {
      type: 'image_url',
      image_url: {
        url: `data:${inner.mimeType};base64,${data}`,
      },
    }
  } else {
    throw new Error('unreachable')
  }
}

async function mapHistory(
  history: ChatHistory,
): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]> {
  return Promise.all(
    history.map(async entry => {
      if (entry.role === 'model') {
        // For assistant messages, OpenAI only supports text content.
        // Combine all text content into a single string.
        const textContent = entry.content
          .map(content => {
            const inner = content.inner()
            if (inner instanceof TextContent) {
              return inner.text
            } else {
              throw new ValidationError(
                'OpenAI does not support images in model messages',
              )
            }
          })
          .filter(text => text.length > 0)
          .join('\n')

        return {
          role: 'assistant',
          content: textContent,
        }
      } else {
        // entry.role === 'user'
        const content = await Promise.all(entry.content.map(contentToOpenAI))
        return {
          role: 'user',
          content: content,
        }
      }
    }),
  )
}

export type OpenAiFlavor = 'openai' | 'deepseek'

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

  async generate(
    history: ChatHistory,
    options: ModelOptions,
    signal?: AbortSignal,
  ): Promise<ModelResponse> {
    const messages = await mapHistory(history)

    if (options.systemPrompt) {
      messages.unshift({
        role: 'system',
        content: options.systemPrompt,
      })
    }

    const requestConfig: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
      model: options.model,
      messages,
      temperature: options.temperature,
    }

    if (options.thinkingEnabled) {
      if (this.flavor == 'deepseek') {
        // @ts-expect-error Nonstandard extension
        requestConfig.enable_thinking = true
      }
    }

    let thoughts = ''
    let text = ''

    if (this.flavor == 'deepseek') {
      const config: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming =
        { ...requestConfig, stream: true }
      const response = await this.client.chat.completions.create(config, {
        signal,
      })

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
      console.dir({ text, thoughts }, { depth: null })
    } else {
      const config: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming =
        { ...requestConfig, stream: false }
      const response = await this.client.chat.completions.create(config, {
        signal,
      })
      console.dir(response, { depth: null })
      if (!response.choices?.length) throw new ApiResponseError()
      text = response.choices[0].message.content || ''
    }

    // OpenAI's stateless API does not support image outputs - perhaps a
    // deliberate choice to encourage vendor lock-in.
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
}
