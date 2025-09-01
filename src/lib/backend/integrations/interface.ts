import { Integration } from "@/lib/backend/integration"
import { BaseError } from "@/lib/error"
import GeminiApi from "@/lib/backend/integrations/gemini"
import { ModelInfo } from "@/lib/frontend/api"

/**
 * Abstract interface that defines an API-agnostic way of interacting with
 * APIs.
 */
export interface IntegrationApi {
  getModels(): Promise<ModelInfo[]>
}

export function getApi(integration: Integration): IntegrationApi {
  switch (integration.interface) {
  case 'openai':
    throw new BaseError('Not yet implemented')
  case 'gemini':
    return new GeminiApi(integration.apiKey, integration.baseUrl)
  default:
    throw new Error('unreachable')
  }
}
