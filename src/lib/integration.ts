import { BaseError } from '@/lib/error'
import { updateRow } from '@/lib/orm'
import getDb from '@/lib/sqlite'
import { Database } from 'better-sqlite3'

export interface Integration {
  id: number
  name: string
  provider: 'openai' | 'gemini'
  apiKey: string
  baseUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateIntegrationRequest {
  name: string
  provider: 'openai' | 'gemini'
  apiKey: string
  baseUrl?: string
}

export interface UpdateIntegrationRequest {
  name?: string
  provider?: 'openai' | 'gemini'
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
      SELECT id, name, provider, apiKey, baseUrl, createdAt, updatedAt
      FROM integrations
      ORDER BY createdAt DESC
    `)

    const rows = stmt.all() as any[]

    return rows.map(IntegrationTable.fromRow)
  }

  /// Looks up an integration by ID.
  public static getById(id: number): Integration | null {
    const stmt = getDb().prepare(`
      SELECT id, name, provider, apiKey, baseUrl, createdAt, updatedAt
      FROM integrations
      WHERE id = ?
    `)

    const row = stmt.get(id) as any

    if (!row) {
      return null
    }

    return IntegrationTable.fromRow(row)
  }

  /// Creates a new integration.
  public static create(data: CreateIntegrationRequest): Integration {
    const stmt = getDb().prepare(`
      INSERT INTO integrations (name, provider, apiKey, baseUrl)
      VALUES (?, ?, ?, ?)
    `)

    const result = stmt.run(data.name, data.provider, data.apiKey, data.baseUrl || null)

    const createdIntegration = this.getById(Number(result.lastInsertRowid))

    if (!createdIntegration) {
      throw new BaseError('Failed to create integration')
    }

    return createdIntegration
  }

  /// Updates and returns an existing integration. Returns `null` if the
  /// integration does not exist.
  public static update(id: number, data: UpdateIntegrationRequest): Integration | null {
    const existing = this.getById(id)
    if (!existing) {
      return null
    }

    let updated = updateRow(getDb(), 'integrations', id, data, ['name', 'provider', 'apiKey', 'baseUrl'])
    if (updated) {
      return this.getById(id)
    } else {
      return existing
    }
  }

  /// Deletes an existing integration. Returns `true` if a row was successfully
  /// deleted.
  public static delete(id: string): boolean {
    const stmt = getDb().prepare(`
      DELETE FROM integrations
      WHERE id = ?
    `)

    const result = stmt.run(id)

    return result.changes > 0
  }
}
