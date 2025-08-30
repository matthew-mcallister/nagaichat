import { cached, Cached } from '@/lib/cache'
import { BaseError, NoSuchResource, ValidationError } from '@/lib/error'
import { getApi, ModelInfo } from '@/lib/integrations/interface'
import { updateRow } from '@/lib/orm'
import getDb from '@/lib/sqlite'

export interface Integration {
  id: number
  name: string
  interface: 'openai' | 'gemini'
  apiKey?: string
  baseUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface IntegrationSensitive extends Integration {
  apiKey: string
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

export class IntegrationTable {
  private static fromRow(row: any): Integration {
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }
  }

  /// Returns an array of all integrations.
  public static getAll(): Integration[] {
    const stmt = getDb().prepare(`
      SELECT id, name, interface, baseUrl, createdAt, updatedAt
      FROM integrations
      ORDER BY createdAt DESC
    `)

    const rows = stmt.all() as any[]

    return rows.map(IntegrationTable.fromRow)
  }

  /// Looks up an integration by ID.
  public static getById(id: number): Integration | null {
    const stmt = getDb().prepare(`
      SELECT id, name, interface, baseUrl, createdAt, updatedAt
      FROM integrations
      WHERE id = ?
    `)

    const row = stmt.get(id) as any

    if (!row) {
      return null
    }

    return IntegrationTable.fromRow(row)
  }

  /// Looks up an integration by ID and retains sensitive information (namely
  /// the API key).
  public static getSensitive(id: number): IntegrationSensitive | null {
    const stmt = getDb().prepare(`
      SELECT id, name, interface, apiKey, baseUrl, createdAt, updatedAt
      FROM integrations
      WHERE id = ?
    `)

    const row = stmt.get(id) as any

    if (!row) {
      return null
    }

    // @ts-ignore
    return IntegrationTable.fromRow(row)
  }

  /// Clears any cache keys related to this integration
  private static clearCache(id: number) {
    IntegrationTable.getModels.clear(id)
  }

  /// Creates a new integration.
  public static create(data: CreateIntegrationRequest): Integration {
    if (!data.name) {
      throw new ValidationError('Integration name cannot be empty')
    }

    const stmt = getDb().prepare(`
      INSERT INTO integrations (name, interface, apiKey, baseUrl)
      VALUES (?, ?, ?, ?)
    `)

    const result = stmt.run(data.name, data.interface, data.apiKey, data.baseUrl || null)

    const createdIntegration = this.getById(Number(result.lastInsertRowid))

    if (!createdIntegration) {
      throw new BaseError('Failed to create integration')
    }

    return createdIntegration
  }

  /// Updates and returns an existing integration. Returns `null` if the
  /// integration does not exist.
  public static update(id: number, data: UpdateIntegrationRequest): Integration | null {
    if (!data.name) {
      throw new ValidationError('Integration name cannot be empty')
    }

    const existing = this.getById(id)
    if (!existing) {
      return null
    }

    let updated = updateRow(getDb(), 'integrations', id, data, ['name', 'interface', 'apiKey', 'baseUrl'])
    if (updated) {
      this.clearCache(id)
      return this.getById(id)
    } else {
      return existing
    }
  }

  /// Deletes an existing integration. Returns `true` if a row was successfully
  /// deleted.
  public static delete(id: number): boolean {
    const stmt = getDb().prepare(`
      DELETE FROM integrations
      WHERE id = ?
    `)

    const result = stmt.run(id)

    if (result.changes > 0) {
      this.clearCache(id)
      return true
    }

    return false
  }

  public static getModels: Cached<[number], ModelInfo[]> = cached(24 * 3600, async (integrationId: number) => {
    const integration = IntegrationTable.getSensitive(integrationId);
    if (!integration) {
      throw new NoSuchResource('Integration not found');
    }

    const api = getApi(integration)
    return api.getModels()
  })
}
