import { BaseError } from '@/lib/error'
import useSWR, { mutate } from "swr"

async function raiseForStatus(response: Response | Promise<Response>): Promise<Response> {
  response = await response
  if (response.status >= 400) {
    let message = undefined
    try {
      const body = await response.json()
      message = body.message
    } catch {}
    throw new BaseError(message)
  }
  return response
}

async function unwrapJson<T>(response: Response | Promise<Response>): Promise<T> {
  response = await raiseForStatus(response)
  try {
    return response.json()
  } catch {
    throw new BaseError()
  }
}

export interface Integration {
  id: number
  name: string
  interface: 'openai' | 'gemini'
  baseUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateIntegrationRequest {
  name: string
  interface: 'openai' | 'gemini'
  apiKey: string
  baseUrl?: string
}

export interface UpdateIntegrationRequest {
  name?: string
  interface?: 'openai' | 'gemini'
  apiKey?: string
  baseUrl?: string
}

export interface ModelInfo {
  name: string
  displayName: string | null
}

export interface ModelOptions {
  integration: number
  model: string
  systemPrompt: string
  temperature: number
  thinkingEnabled: boolean
  // TODO: Explicit content settings
}

// FIXME: Handle missing options correctly
export interface SessionOptions {
  modelOptions: ModelOptions,
  renderMarkdown: boolean,
}

export interface Preset {
  id: number
  name: string
  options: SessionOptions
}

export interface CreatePresetRequest {
  name: string
  options: SessionOptions
}

export interface UpdatePresetRequest {
  name?: string
  options?: SessionOptions
}

export type TextContent = {
  type: 'text'
  text: string
}

export type InlineContent = {
  type: 'inline'
  mimeType: string
  /** base64-encoded data */
  data: string
}

export type StaticContent = {
  type: 'static'
  id: number
  url: string
}

export type ContentObject = TextContent | InlineContent | StaticContent
export type Content = ContentObject

export type ImageContent = InlineContent | StaticContent

export type Role = 'user' | 'model'

export interface Session {
  id: number
  name: string
  presetId: number | null
  latestItemId: number | null
  options: SessionOptions
  createdAt: string
  updatedAt: string
}

/// Creates a new session with the given initial message and options.
export interface CreateSessionRequest {
  initialContent: Content | Content[]
  presetId?: number
  options: SessionOptions
}

export interface Item {
  id: number
  sessionId: number
  parentId: number | null
  content: ContentObject[]
  role: Role
  createdAt: string
  updatedAt: string
}

export function getItemText(item: Item): string | undefined {
  for (const content of item.content) {
    if (content.type === 'text') {
      return content.text
    }
  }
}

export interface CreateModelItemRequest {
  role: 'model'
  sessionId: number
  parentId: number | null
  presetId: number | null
  options: SessionOptions
}

export interface CreateUserItemRequest {
  role: 'user'
  sessionId: number
  parentId: number | null
  presetId: number | null
  options: SessionOptions
  content: ContentObject[]
}

export type CreateItemRequest = CreateModelItemRequest | CreateUserItemRequest

export interface UpdateItemRequest {
  content: ContentObject[]
}

/**
 * Wrapper around the backend API.
 */
export class Api {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || ''
  }

  private async get<T>(endpoint: string): Promise<T> {
    return unwrapJson(fetch(this.baseUrl + endpoint, {
      method: 'GET',
    }))
  }

  private async put<S, T>(endpoint: string, json: S): Promise<T> {
    return unwrapJson(fetch(this.baseUrl + endpoint, {
      method: 'PUT',
      headers: {
      'Content-Type': 'application/json',
      },
      body: JSON.stringify(json),
    }))
  }

  private async patch<S, T>(endpoint: string, json: S): Promise<T> {
    return unwrapJson(fetch(this.baseUrl + endpoint, {
      method: 'PATCH',
      headers: {
      'Content-Type': 'application/json',
      },
      body: JSON.stringify(json),
    }))
  }

  private async post<S, T>(endpoint: string, json: S, fetchOptions?: any): Promise<T> {
    return unwrapJson(fetch(this.baseUrl + endpoint, {
      ...fetchOptions,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json),
    }))
  }

  private async update<S, T>(endpoint: string, json: S): Promise<T> {
    return unwrapJson(fetch(this.baseUrl + endpoint, {
      method: 'UPDATE',
      headers: {
      'Content-Type': 'application/json',
      },
      body: JSON.stringify(json),
    }))
  }

  private async delete(endpoint: string): Promise<void> {
    raiseForStatus(await fetch(this.baseUrl + endpoint, {
      method: 'DELETE',
    }))
  }

  public async listIntegrations(): Promise<Integration[]> {
    return this.get('/api/integrations')
  }

  public useIntegrations(): Integration[] | null {
    const { data } = useSWR('/api/integrations', () => this.listIntegrations())
    return data || null
  }

  public async updateIntegration(id: number, body: UpdateIntegrationRequest): Promise<Integration> {
    const result: Integration = await this.patch(`/api/integrations/${id}`, body)
    await mutate('/api/integrations')
    await mutate(`/api/integrations/${result.id}/models`)
    return result
  }

  public async createIntegration(body: CreateIntegrationRequest): Promise<Integration> {
    const result: Integration = await this.post('/api/integrations', body)
    await mutate('/api/integrations')
    await mutate(`/api/integrations/${result.id}/models`)
    return result
  }

  public async listModels(integrationId: number): Promise<ModelInfo[]> {
    return this.get(`/api/integrations/${integrationId}/models`)
  }

  public useAvailableModels(integrationId: number | null): ModelInfo[] | null {
    const { data } = useSWR(
      integrationId !== null ? `/api/integrations/${integrationId}/models` : null,
      () => integrationId !== null ? this.listModels(integrationId) : null,
    )
    return data || null
  }

  public async listSessions(): Promise<Session[]> {
    return this.get('/api/sessions')
  }

  public useSessions(): Session[] | null {
    const { data } = useSWR('/api/sessions', () => this.listSessions())
    return data || null
  }

  public async getSession(id: number): Promise<Session> {
    return this.get(`/api/sessions/${id}`)
  }

  public useSession(id: number): Session | null {
    const { data } = useSWR(`/api/sessions/${id}`, () => this.getSession(id))
    return data || null
  }

  public async createSession(body: CreateSessionRequest): Promise<Session> {
    const result = await this.post<CreateSessionRequest, Session>('/api/sessions', body)
    await mutate('/api/sessions')
    return result
  }

  public async deleteSession(id: number): Promise<void> {
    await this.delete(`/api/sessions/${id}`)
    await mutate('/api/sessions')
  }

  public async listPresets(): Promise<Preset[]> {
    return this.get('/api/presets')
  }

  public usePresets(): Preset[] | null {
    const { data } = useSWR('/api/presets', () => this.listPresets())
    return data || null
  }

  public async createPreset(body: CreatePresetRequest): Promise<Preset> {
    const result = await this.post<CreatePresetRequest, Preset>('/api/presets', body)
    await mutate('/api/presets')
    return result
  }

  public async updatePreset(id: number, body: UpdatePresetRequest): Promise<Preset> {
    const result: Preset = await this.patch(`/api/presets/${id}`, body)
    await mutate('/api/presets')
    return result
  }

  public async deletePreset(id: number): Promise<void> {
    await this.delete(`/api/presets/${id}`)
    mutate('/api/presets')
  }

  public async listSessionItems(sessionId: number): Promise<Item[]> {
    return this.get(`/api/items?sessionId=${sessionId}`)
  }

  public useSessionItems(sessionId: number): Item[] | null {
    const { data } = useSWR(`/api/items?sessionId=${sessionId}`, () => this.listSessionItems(sessionId))
    return data || null
  }

  public async createItem(body: CreateItemRequest, signal?: AbortSignal): Promise<Item> {
    const options: any = {}
    if (signal) {
      options.signal = signal
    }
    const result: Item = await this.post('/api/items', body, options)
    await mutate(`/api/items?sessionId=${body.sessionId}`)
    return result
  }

  public async updateItem(id: number, body: UpdateItemRequest): Promise<Item> {
    const result: Item = await this.patch(`/api/items/${id}`, body)
    await mutate(`/api/items?sessionId=${result.sessionId}`)
    return result
  }
}

export interface SessionOptionsFields {
  integration?: number
  model?: string
  systemPrompt: string
  temperature: number
  thinkingEnabled: boolean
  renderMarkdown: boolean
}

export function validateOptions(
  options: SessionOptionsFields
): SessionOptions | null {
  if (!options.integration || !options.model) return null
  return {
    modelOptions: {
      integration: options.integration,
      model: options.model,
      systemPrompt: options.systemPrompt,
      temperature: options.temperature,
      thinkingEnabled: options.thinkingEnabled,
    },
    renderMarkdown: options.renderMarkdown,
  }
}
export function fromPreset(options: SessionOptions): SessionOptionsFields {
  return {
    integration: options.modelOptions.integration,
    model: options.modelOptions.model,
    systemPrompt: options.modelOptions.systemPrompt,
    temperature: options.modelOptions.temperature,
    thinkingEnabled: options.modelOptions.thinkingEnabled,
    renderMarkdown: options.renderMarkdown,
  }
}

export default Api
