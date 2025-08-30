import { BaseError } from "@/lib/error"
import { IntegrationSensitive } from "@/lib/integration"
import GeminiApi from "@/lib/integrations/gemini"

export interface ModelInfo {
  name: string
  displayName?: string
}

/**
 * Abstract interface that defines an API-agnostic way of interacting with
 * APIs.
 */
export interface IntegrationApi {
  getModels(): Promise<ModelInfo[]>
}

export function getApi(integration: IntegrationSensitive): IntegrationApi {
  switch (integration.interface) {
  case 'openai':
    throw new BaseError('Not yet implemented')
  case 'gemini':
    return new GeminiApi(integration.apiKey, integration.baseUrl)
  }
}
