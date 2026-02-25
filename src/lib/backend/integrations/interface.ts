import { Content } from '@/lib/backend/content'
import { Integration } from '@/lib/backend/integration'
import AnthropicApi from '@/lib/backend/integrations/anthropic'
import GeminiApi from '@/lib/backend/integrations/gemini'
import OpenAiApi from '@/lib/backend/integrations/openai'
import { Item } from '@/lib/backend/item'
import { Session } from '@/lib/backend/session'
import {
  Content as ApiContent,
  ModelInfo,
  ModelOptions,
  Role,
} from '@/lib/frontend/shared'
import { Transaction } from 'sequelize'

export interface HistoryEntry {
  role: Role
  content: Content[]
}

export type ChatHistory = HistoryEntry[]

export interface ModelResponse {
  content: ApiContent[]
}

/**
 * Abstract interface that defines an API-agnostic way of interacting with
 * APIs.
 */
export interface IntegrationApi {
  listModels(): Promise<ModelInfo[]>
  generate(
    history: ChatHistory,
    options: ModelOptions,
    signal?: AbortSignal,
  ): Promise<ModelResponse>
}

/**
 * Wrapper around an integration that maps application logic to API calls.
 */
export class ApiConnector {
  private integration: Integration
  private api: IntegrationApi

  constructor(integration: Integration) {
    this.integration = integration

    switch (integration.interface) {
      case 'openai':
        this.api = new OpenAiApi(
          integration.apiKey,
          integration.baseUrl,
          'openai',
        )
        break
      case 'deepseek':
        this.api = new OpenAiApi(
          integration.apiKey,
          integration.baseUrl,
          'deepseek',
        )
        break
      case 'gemini':
        this.api = new GeminiApi(
          integration.apiKey,
          integration.baseUrl || undefined,
        )
        break
      case 'anthropic':
        this.api = new AnthropicApi(
          integration.apiKey,
          integration.baseUrl || undefined,
        )
        break
      default:
        throw new Error('unreachable')
    }
  }

  /**
   * Lists models available for inference.
   */
  public listModels(): Promise<ModelInfo[]> {
    return this.api.listModels()
  }

  /**
   * Creates a new response to a chat item.
   *
   * - The chat history is automatically reconstructed from the given item.
   * - A new item is created for the response.
   * - The new item is returned.
   */
  public async generate(
    parent: Item,
    transaction: Transaction,
    signal?: AbortSignal,
  ): Promise<Item> {
    const session = await Session.getById(parent.sessionId, transaction)

    // Construct history
    const items = [parent]
    let it = parent
    while (it.parentId) {
      it = await Item.getById(it.parentId, transaction)
      items.push(it)
    }
    items.reverse()
    const history: ChatHistory = items.map(item => ({
      role: item.role,
      content: item.content,
    }))

    const response = await this.api.generate(
      history,
      session.options.modelOptions,
      signal,
    )

    return Item.doCreate({
      sessionId: parent.sessionId,
      parentId: parent.id,
      role: 'model',
      content: response.content,
      transaction,
    })
  }
}
