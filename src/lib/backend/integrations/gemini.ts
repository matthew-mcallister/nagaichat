import { Content, TextContent } from '@/lib/backend/content'
import {
  ChatHistory,
  IntegrationApi,
  ModelResponse,
} from '@/lib/backend/integrations/interface'
import { StaticContent } from '@/lib/backend/static'
import {
  Content as ApiContent,
  getReasoningEffort,
  ModelInfo,
  ModelOptions,
} from '@/lib/frontend/shared'
import {
  GenerateContentConfig,
  GenerateContentParameters,
  Candidate as GoogleCandidate,
  Content as GoogleContent,
  GoogleGenAI,
  GoogleGenAIOptions,
  Part as GooglePart,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/genai'

async function contentToGoogle(content: Content): Promise<GooglePart> {
  const inner = content.inner()
  if (inner instanceof TextContent) {
    return { text: content.text || undefined }
  } else if (inner instanceof StaticContent) {
    const data = (await inner.read()).toString('base64')
    return {
      inlineData: {
        mimeType: inner.mimeType,
        data,
      },
    }
  } else {
    throw new Error('unreachable')
  }
}

async function mapHistory(history: ChatHistory): Promise<GoogleContent[]> {
  return Promise.all(
    history.map(async entry => {
      const role = entry.role
      const parts = await Promise.all(entry.content.map(contentToGoogle))
      const content: GoogleContent = { role, parts }
      return content
    }),
  )
}

function getThinkingConfig(options: ModelOptions) {
  switch (getReasoningEffort(options)) {
    case 'none':
      return {
        thinkingBudget: 0,
      }
    case 'low':
      return {
        includeThoughts: true,
        thinkingBudget: 1024,
      }
    case 'medium':
      return {
        includeThoughts: true,
        thinkingBudget: 4096,
      }
    case 'high':
      return {
        includeThoughts: true,
        thinkingBudget: 8192,
      }
    case 'xhigh':
      return {
        includeThoughts: true,
        thinkingBudget: 16384,
      }
    case null:
      return {
        includeThoughts: true,
      }
  }
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
    const response = await this.client.models.list()
    const models: ModelInfo[] = []

    for await (const model of response) {
      if (!model.name) {
        continue
      }
      models.push({
        name: model.name,
        displayName: model.displayName || null,
      })
    }

    return models
  }

  private async makeRequestConfig(
    history: ChatHistory,
    options: ModelOptions,
    signal?: AbortSignal,
  ): Promise<GenerateContentParameters> {
    const contents = await mapHistory(history)
    const config: GenerateContentConfig = {
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.OFF,
        },
      ],
      systemInstruction: options.systemPrompt || undefined,
      temperature: options.temperature,
      thinkingConfig: getThinkingConfig(options),
    }
    if (signal) {
      config.abortSignal = signal
    }
    return {
      contents,
      model: options.model,
      config,
    }
  }

  async *generateStreaming(
    history: ChatHistory,
    options: ModelOptions,
    signal?: AbortSignal,
  ): AsyncIterable<ModelResponse> {
    const body = await this.makeRequestConfig(history, options, signal)
    const stream = await this.client.models.generateContentStream(body)

    let text = ''
    let thoughts = ''
    for await (const response of stream) {
      if (response.usageMetadata) {
        console.dir(response.usageMetadata, { depth: null })
      }

      const candidate: GoogleCandidate | undefined = (response.candidates ||
        [])[0]
      const parts = candidate?.content?.parts || []
      for (const part of parts) {
        if (part.text) {
          if (part.thought) {
            thoughts += part.text
          } else {
            text += part.text
          }
        }
      }

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
      yield { content }
    }

    console.dir({ text, thoughts }, { depth: null })
  }
}
