import { Content as BackendContent, TextContent } from '@/lib/backend/content'
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
} from '@/lib/frontend/api'

import Anthropic, { ClientOptions } from '@anthropic-ai/sdk'

const DEFAULT_MAX_OUTPUT_TOKENS = 4096
const DEFAULT_THINKING_BUDGET = 2048
type AnthropicImageMime = Anthropic.Messages.Base64ImageSource['media_type']

function toAnthropicImageMime(mime: string): AnthropicImageMime {
  if (mime === 'image/png' || mime === 'image/jpeg') {
    return mime
  }
  throw new ValidationError(`Unsupported file type for Anthropic: ${mime}`)
}

async function contentToAnthropic(
  content: BackendContent,
): Promise<Anthropic.Messages.ContentBlockParam | null> {
  const inner = content.inner()

  if (inner instanceof TextContent) {
    if (inner.isThought) {
      return null
    }
    return {
      type: 'text',
      text: inner.text,
    }
  }

  if (inner instanceof StaticContent) {
    const data = (await inner.read()).toString('base64')
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: toAnthropicImageMime(inner.mimeType),
        data,
      },
    }
  }

  return null
}

async function anthropicToContent(
  block: Anthropic.Messages.ContentBlock,
): Promise<ApiContent | null> {
  switch (block.type) {
    case 'text':
      return { type: 'text', text: block.text }
    case 'thinking':
      return { type: 'thought', text: block.thinking }
    default:
      return null
  }
}

export default class AnthropicApi implements IntegrationApi {
  private client: Anthropic

  constructor(apiKey: string, baseUrl?: string) {
    const options: ClientOptions = { apiKey }
    if (baseUrl) {
      options.baseURL = baseUrl
    }
    this.client = new Anthropic(options)
  }

  async listModels(): Promise<ModelInfo[]> {
    const models: ModelInfo[] = []
    const response = this.client.models.list()

    for await (const model of response) {
      if (!model.id) {
        continue
      }
      models.push({
        name: model.id,
        displayName: model.display_name || null,
      })
    }

    return models
  }

  async generate(
    history: ChatHistory,
    options: ModelOptions,
    signal?: AbortSignal,
  ): Promise<ModelResponse> {
    const messages: Anthropic.Messages.MessageParam[] = []

    for (const entry of history) {
      const role = entry.role === 'model' ? 'assistant' : 'user'
      const blocks: Anthropic.Messages.ContentBlockParam[] = []
      for (const content of entry.content) {
        const block = await contentToAnthropic(content)
        if (block) {
          blocks.push(block)
        }
      }
      if (!blocks.length) {
        continue
      }
      messages.push({ role, content: blocks })
    }

    if (messages.length > 0) {
      const blocks = messages[messages.length - 1].content
      const block = blocks[blocks.length - 1]
      // @ts-expect-error aaa
      block.cache_control = {type: 'ephemeral'}
    }

    const request: Anthropic.Messages.MessageCreateParamsNonStreaming = {
      model: options.model,
      messages,
      max_tokens: DEFAULT_MAX_OUTPUT_TOKENS,
      temperature: options.temperature,
      stream: false,
    }

    if (options.systemPrompt) {
      request.system = [{
        type: 'text',
        text: options.systemPrompt,
        cache_control: {type: 'ephemeral'},
      }]
    }

    if (options.thinkingEnabled) {
      request.thinking = {
        type: 'enabled',
        budget_tokens: DEFAULT_THINKING_BUDGET,
      }
    } else {
      request.thinking = { type: 'disabled' }
    }

    const response = await this.client.messages.create(request, { signal })
    console.dir(response, { depth: null })

    if (!response.content?.length) {
      throw new ApiResponseError()
    }

    const mapped = await Promise.all(response.content.map(anthropicToContent))
    const content = mapped.filter(
      (entry): entry is ApiContent => entry !== null,
    )
    if (!content.length) {
      throw new ApiResponseError()
    }

    return { content }
  }
}
