import { BaseError } from "@/lib/error"
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
  baseUrl?: string
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
  displayName?: string
}

export interface ModelOptions {
  integration: number
  model: string
  systemPrompt: string
  temperature: number
  thinkingEnabled: boolean
}

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
  name: string
  options: SessionOptions
}

export type TextContent = {
  type: 'string'
  message: string
}

// TODO eventually: should support some kind of uploads API
export type ImageContent = {
  type: 'image'
  data: string
}

export type Content = string | TextContent | ImageContent

export type HistoryItem = {
  role: 'user' | 'model'
  content: Content
}

export interface Session {
  id: number
  options: SessionOptions
  history: HistoryItem[]
}

/// Creates a new session with the given initial message and options.
export interface CreateSessionRequest {
  content: Content[]
  options: SessionOptions
}

/// Adds a message and generated response to the session. The last used
/// options will be saved to the session.
export interface CreateResponseRequest {
  content: Content[]
  options: SessionOptions
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

  private async post<S, T>(endpoint: string, json: S): Promise<T> {
    return unwrapJson(fetch(this.baseUrl + endpoint, {
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
    return this.patch(`/api/integrations/${id}`, body)
  }

  public async createIntegration(body: CreateIntegrationRequest): Promise<Integration> {
    return this.post('/api/integrations', body)
  }

  public async listModels(integrationId: number): Promise<ModelInfo[]> {
    // TODO: Cache this output on backend
    return this.get(`/api/integrations/${integrationId}/models`)
  }

  public useAvailableModels(integrationId: number | null): ModelInfo[] | null {
    const { data } = useSWR(
      integrationId !== null ? `/api/integrations/${integrationId}/models` : null,
      () => integrationId !== null ? this.listModels(integrationId) : null,
    )
    return data || null
  }

  public async createSession(message: string, options: SessionOptions): Promise<Session> {
    return this.post('/api/sessions', {
      content: [message],
      options,
    })
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
    mutate('/api/presets')
    return result
  }

  public async deletePreset(id: number): Promise<void> {
    await this.delete(`/api/presets/${id}`)
    mutate('/api/presets')
  }
}

export default Api
