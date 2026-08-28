import {
  ChatHistory,
  IntegrationApi,
  ModelResponse,
} from '@/lib/backend/integrations/interface'
import { ModelInfo, ModelOptions } from '@/lib/frontend/shared'

import Anthropic, { ClientOptions } from '@anthropic-ai/sdk'

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

  generateStreaming(
    _history: ChatHistory,
    _options: ModelOptions,
    _signal?: AbortSignal,
  ): AsyncIterable<ModelResponse> {
    throw new Error('not implemented yet')
  }
}
