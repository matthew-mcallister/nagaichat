import { Integration } from '@/lib/backend/integration'
import { BaseError } from '@/lib/error'
import GeminiApi from '@/lib/backend/integrations/gemini'
import { ContentObject, ModelInfo, ModelOptions, Role } from '@/lib/frontend/api'
import { Transaction } from "sequelize"
import { Item } from '@/lib/backend/item'

export interface HistoryEntry {
  role: Role
  content: ContentObject[]
}

export type ChatHistory = HistoryEntry[]

export interface ModelResponse {
  content: ContentObject[]
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
      throw new BaseError('Not yet implemented')
    case 'gemini':
      this.api = new GeminiApi(integration.apiKey, integration.baseUrl || undefined)
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
    const session = await parent.getSession()

    // Construct history
    const items = [parent]
    let it = parent
    while (it.parentId) {
      it = await it.getParent() as Item
      items.push(it)
    }
    items.reverse()
    const history: ChatHistory = items.map(item => ({
      role: item.role,
      content: item.content,
    }))

    const response = await this.api.generate(history, session.options.modelOptions, signal)

    const item = await Item.create({
      sessionId: parent.sessionId,
      parentId: parent.id,
      content: response.content,
      role: 'model',
    }, { transaction })

    return item
  }
}
