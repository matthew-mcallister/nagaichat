'use client'

import { BaseError } from '@/lib/error'
import useSWR, { mutate } from 'swr'

export type {
  Interface,
  Integration,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
  ModelInfo,
  ModelOptions,
  SessionOptions,
  Preset,
  CreatePresetRequest,
  UpdatePresetRequest,
  TextContent,
  ThoughtContent,
  InlineContent,
  StaticContent,
  ContentObject,
  Content,
  ImageContent,
  Role,
  Session,
  CreateSessionRequest,
  Item,
  CreateModelItemRequest,
  CreateUserItemRequest,
  CreateItemRequest,
  UpdateItemRequest,
  SessionOptionsFields,
} from './shared'

export {
  INTERFACES,
  getItemText,
  getItemImageContent,
  getItemImageUris,
  getItemThoughts,
  validateOptions,
  fromPreset,
} from './shared'

import type {
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
  ModelInfo,
  SessionOptions,
  Preset,
  CreatePresetRequest,
  UpdatePresetRequest,
  Session,
  CreateSessionRequest,
  Item,
  CreateItemRequest,
  UpdateItemRequest,
  Integration,
  ContentObject,
} from './shared'

async function raiseForStatus(
  response: Response | Promise<Response>,
): Promise<Response> {
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

async function unwrapJson<T>(
  response: Response | Promise<Response>,
): Promise<T> {
  response = await raiseForStatus(response)
  try {
    return response.json()
  } catch {
    throw new BaseError()
  }
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
    return unwrapJson(
      fetch(this.baseUrl + endpoint, {
        method: 'GET',
      }),
    )
  }

  private async put<S, T>(endpoint: string, json: S): Promise<T> {
    return unwrapJson(
      fetch(this.baseUrl + endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json),
      }),
    )
  }

  private async patch<S, T>(endpoint: string, json: S): Promise<T> {
    return unwrapJson(
      fetch(this.baseUrl + endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json),
      }),
    )
  }

  private async post<S, T>(
    endpoint: string,
    json: S,
    fetchOptions?: any,
  ): Promise<T> {
    return unwrapJson(
      fetch(this.baseUrl + endpoint, {
        ...fetchOptions,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json),
      }),
    )
  }

  private async update<S, T>(endpoint: string, json: S): Promise<T> {
    return unwrapJson(
      fetch(this.baseUrl + endpoint, {
        method: 'UPDATE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json),
      }),
    )
  }

  private async delete(endpoint: string): Promise<void> {
    raiseForStatus(
      await fetch(this.baseUrl + endpoint, {
        method: 'DELETE',
      }),
    )
  }

  public async listIntegrations(): Promise<Integration[]> {
    return this.get('/api/integrations')
  }

  public useIntegrations(): Integration[] | null {
    const { data } = useSWR('/api/integrations', () => this.listIntegrations())
    return data || null
  }

  public async updateIntegration(
    id: number,
    body: UpdateIntegrationRequest,
  ): Promise<Integration> {
    const result: Integration = await this.patch(
      `/api/integrations/${id}`,
      body,
    )
    await mutate('/api/integrations')
    await mutate(`/api/integrations/${result.id}/models`)
    return result
  }

  public async createIntegration(
    body: CreateIntegrationRequest,
  ): Promise<Integration> {
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
      integrationId !== null
        ? `/api/integrations/${integrationId}/models`
        : null,
      () => (integrationId !== null ? this.listModels(integrationId) : null),
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
    const result = await this.post<CreateSessionRequest, Session>(
      '/api/sessions',
      body,
    )
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
    const result = await this.post<CreatePresetRequest, Preset>(
      '/api/presets',
      body,
    )
    await mutate('/api/presets')
    return result
  }

  public async updatePreset(
    id: number,
    body: UpdatePresetRequest,
  ): Promise<Preset> {
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
    const { data } = useSWR(`/api/items?sessionId=${sessionId}`, () =>
      this.listSessionItems(sessionId),
    )
    return data || null
  }

  public async createItem(
    body: CreateItemRequest,
    signal?: AbortSignal,
  ): Promise<Item> {
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

export default Api
