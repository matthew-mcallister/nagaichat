import { BaseError } from "@/lib/error"
import { CreateIntegrationRequest, Integration, UpdateIntegrationRequest } from "@/lib/integration"

async function raiseForStatus(response: Response | Promise<Response>): Promise<Response> {
  response = await response
  if (response.status >= 400) {
  try {
    let body = await response.json()
    if (body.message) {
    throw new BaseError(body.message)
    }
  } catch (e) {}
  throw new BaseError()
  }
  return response
}

async function unwrapJson<T>(response: Response | Promise<Response>): Promise<T> {
  response = await raiseForStatus(response)
  try {
  return response.json()
  } catch (e) {
  throw new BaseError()
  }
}

/**
 * Wrapper around the backend API.
 */
export default class Api {
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

  public async updateIntegration(id: number, body: UpdateIntegrationRequest): Promise<Integration> {
    return this.patch(`/api/integrations/${id}`, body)
  }

  public async createIntegration(body: CreateIntegrationRequest): Promise<Integration> {
    return this.post('/api/integrations', body)
  }
}