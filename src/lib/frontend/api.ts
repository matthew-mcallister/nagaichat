'use client'

import { BaseError } from '@/lib/error'
import useSWR, { mutate, SWRResponse } from 'swr'

export type {
  Content,
  ContentObject,
  CreateIntegrationRequest,
  CreateItemRequest,
  CreateModelItemRequest,
  CreatePresetRequest,
  CreateSessionRequest,
  CreateUserItemRequest,
  ImageContent,
  InlineContent,
  Integration,
  Interface,
  Item,
  ModelInfo,
  ModelOptions,
  Preset,
  Role,
  Session,
  SessionOptions,
  SessionOptionsFields,
  StaticContent,
  TextContent,
  ThoughtContent,
  UpdateIntegrationRequest,
  UpdateItemRequest,
  UpdatePresetRequest,
} from './shared'

export {
  fromPreset,
  getItemImageContent,
  getItemImageUris,
  getItemText,
  getItemThoughts,
  INTERFACES,
  validateOptions,
} from './shared'

import type {
  Content,
  CreateIntegrationRequest,
  CreateItemRequest,
  CreatePresetRequest,
  CreateSessionRequest,
  Integration,
  Item,
  ModelInfo,
  ModelOptions,
  Preset,
  Session,
  SessionOptions,
  UpdateIntegrationRequest,
  UpdateItemRequest,
  UpdatePresetRequest,
} from './shared'

function serializeModelOptions(options: ModelOptions): Record<string, unknown> {
  const legacyKey = ['thinking', 'Enabled'].join('')
  return {
    ...options,
    [legacyKey]: options.reasoningEffort !== 'none',
  }
}

function serializeSessionOptions(
  options: SessionOptions,
): Record<string, unknown> {
  return {
    ...options,
    modelOptions: serializeModelOptions(options.modelOptions),
  }
}

function serializeRequestBody<T>(body: T): T {
  if (!body || typeof body !== 'object') {
    return body
  }

  if ('options' in body && body.options && typeof body.options === 'object') {
    return {
      ...body,
      options: serializeSessionOptions(body.options as SessionOptions),
    }
  }

  return body
}

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

const BASE_URL: string =
  process.env.NODE_ENV === 'production' ? '' : 'http://127.0.0.1:3001'

/**
 * Wrapper around the backend API.
 */
export class Api {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || BASE_URL
  }

  private url(endpoint: string): string {
    const migrated = new RegExp('^/api/presets')
    if (migrated.test(endpoint)) {
      return this.baseUrl + endpoint
    } else {
      // XXX: Once migration is finished always use the new base URL
      return endpoint
    }
  }

  private async get<T>(endpoint: string): Promise<T> {
    return unwrapJson(
      fetch(this.url(endpoint), {
        method: 'GET',
      }),
    )
  }

  private async put<S, T>(endpoint: string, json: S): Promise<T> {
    return unwrapJson(
      fetch(this.url(endpoint), {
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
      fetch(this.url(endpoint), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serializeRequestBody(json)),
      }),
    )
  }

  private async post<S, T>(
    endpoint: string,
    json: S,
    fetchOptions?: any,
  ): Promise<T> {
    return unwrapJson(
      fetch(this.url(endpoint), {
        ...fetchOptions,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serializeRequestBody(json)),
      }),
    )
  }

  private async update<S, T>(endpoint: string, json: S): Promise<T> {
    return unwrapJson(
      fetch(this.url(endpoint), {
        method: 'UPDATE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json),
      }),
    )
  }

  private async delete(endpoint: string): Promise<void> {
    await raiseForStatus(
      await fetch(this.url(endpoint), {
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

  public useSessionItems(sessionId: number): SWRResponse<Item[] | null> {
    const response = useSWR(
      `/api/items?sessionId=${sessionId}`,
      (): Promise<Item[] | null> => this.listSessionItems(sessionId) || null,
    )
    return response
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
    await mutate(`/api/items?sessionId=${body.sessionId}`, (list: any) =>
      list.concat([result]),
    )
    return result
  }

  public async updateItem(id: number, body: UpdateItemRequest): Promise<Item> {
    const result: Item = await this.patch(`/api/items/${id}`, body)
    await mutate(`/api/items?sessionId=${result.sessionId}`)
    return result
  }

  public async streamItemContent(
    id: number,
    onUpdate: (content: Content[]) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(
        `${this.baseUrl}/api/items/${id}/stream`,
      )
      let settled = false

      const cleanup = () => {
        eventSource.close()
      }

      const resolveStream = () => {
        if (settled) {
          return
        }
        settled = true
        cleanup()
        resolve()
      }

      const rejectStream = (error: BaseError) => {
        if (settled) {
          return
        }
        settled = true
        cleanup()
        reject(error)
      }

      eventSource.addEventListener('update', event => {
        try {
          onUpdate(JSON.parse(event.data) as Content[])
        } catch {
          rejectStream(new BaseError('Received invalid stream update'))
        }
      })

      eventSource.addEventListener('close', () => {
        resolveStream()
      })

      eventSource.onerror = () => {
        if (eventSource.readyState === EventSource.CLOSED) {
          resolveStream()
          return
        }

        rejectStream(new BaseError('Streaming connection failed'))
      }
    })
  }

  public async cancelItemStream(id: number): Promise<void> {
    await this.delete(`/api/items/${id}/stream`)
  }
}

export default Api
