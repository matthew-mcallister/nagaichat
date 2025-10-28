import {
  ChatHistory,
  IntegrationApi,
  ModelResponse,
} from '@/lib/backend/integrations/interface'
import { ModelInfo, ModelOptions } from '@/lib/frontend/api'

export default class AnthropicApi implements IntegrationApi {
  constructor(apiKey: string, baseUrl?: string) {}

  listModels(): Promise<ModelInfo[]> {
    throw new Error('Method not implemented.')
  }

  generate(
    history: ChatHistory,
    options: ModelOptions,
    signal?: AbortSignal,
  ): Promise<ModelResponse> {
    throw new Error('Method not implemented.')
  }
}
