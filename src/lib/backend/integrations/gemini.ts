import { GoogleGenAI, GoogleGenAIOptions } from "@google/genai"
import { IntegrationApi } from "@/lib/backend/integrations/interface"
import { ModelInfo } from "@/lib/frontend/api"

export default class GeminiApi implements IntegrationApi {
  private client: GoogleGenAI

  constructor(apiKey: string, baseUrl?: string) {
    const options: GoogleGenAIOptions = { apiKey }
    if (baseUrl) {
      options.httpOptions = { baseUrl }
    }
    this.client = new GoogleGenAI(options)
  }

  async getModels(): Promise<ModelInfo[]> {
    // XXX: Not sure that all of these models can be used to generate text...?
    const response = await this.client.models.list()
    const models: ModelInfo[] = []

    for await (const model of response) {
      if (!model.name) { continue }
      models.push({
        name: model.name,
        displayName: model.displayName,
      })
    }

    return models
  }
}