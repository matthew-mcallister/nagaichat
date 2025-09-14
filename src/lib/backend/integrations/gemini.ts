import {
  GoogleGenAI,
  GoogleGenAIOptions,
  Content as GoogleContent,
  Part as GooglePart,
  HarmBlockThreshold,
  HarmCategory,
  GenerateContentParameters,
  GenerateContentConfig,
  Candidate as GoogleCandidate,
} from "@google/genai"
import { ChatHistory, IntegrationApi, ModelResponse } from "@/lib/backend/integrations/interface"
import { ContentObject, ModelInfo, ModelOptions } from "@/lib/frontend/api"
import { ApiResponseError } from "@/lib/error"

function contentToGoogle(content: ContentObject): GooglePart {
  switch (content.type) {
  case 'text':
    return { text: content.text }
  case 'inline':
    return { inlineData: {
      mimeType: content.mimeType,
      data: content.data,
    } }
  }
}

function googleToContent(content: GooglePart): ContentObject {
  if (content.text) {
    return { type: 'text', text: content.text }
  } else if (content.inlineData) {
    const { mimeType, data } = content.inlineData
    if (!mimeType || !data) {
      throw new ApiResponseError()
    }
    return { type: 'inline', mimeType, data }
  } else {
    throw new ApiResponseError()
  }
}

function mapHistory(history: ChatHistory): GoogleContent[] {
  return history.map(entry => {
    const role = entry.role
    const parts = entry.content.map(contentToGoogle)
    const content: GoogleContent = { role, parts }
    return content
  })
}

export default class GeminiApi implements IntegrationApi {
  private client: GoogleGenAI

  constructor(apiKey: string, baseUrl?: string) {
    const options: GoogleGenAIOptions = { apiKey }
    if (baseUrl) {
      options.httpOptions = { baseUrl }
    }
    this.client = new GoogleGenAI(options)
  }

  async listModels(): Promise<ModelInfo[]> {
    // XXX: Not sure that all of these models can be used to generate text...?
    const response = await this.client.models.list()
    const models: ModelInfo[] = []

    for await (const model of response) {
      if (!model.name) { continue }
      models.push({
        name: model.name,
        displayName: model.displayName || null,
      })
    }

    return models
  }

  async generate(history: ChatHistory, options: ModelOptions, signal?: AbortSignal): Promise<ModelResponse> {
    const contents = mapHistory(history)
    const config: GenerateContentConfig = {
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.OFF },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.OFF },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.OFF },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.OFF },
      ],
      systemInstruction: options.systemPrompt,
      temperature: options.temperature,
    }
    if (!options.thinkingEnabled) {
      config.thinkingConfig = {
        thinkingBudget: 0,
      }
    }
    if (signal) {
      config.abortSignal = signal
    }
    const body: GenerateContentParameters = {
      contents,
      model: options.model,
      config,
    }
    const response = await this.client.models.generateContent(body as GenerateContentParameters)
    const candidate: GoogleCandidate | undefined = (response.candidates || [])[0]
    const content = candidate?.content?.parts?.map(googleToContent)
    if (!content) {
      console.error(response)
      throw new ApiResponseError()
    }
    return { content }
  }
}
