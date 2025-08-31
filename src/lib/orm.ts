// TODO: Add some kind of lightweight model abstraction

import { Database } from "better-sqlite3"

/**
 * Helper function for updating several fields of a table.
 */
export function updateRow(db: Database, table: string, id: number, data: any, fields: string[]): boolean {
  const updates: string[] = []
  const values: any[] = []

  for (const field of fields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`)
      values.push(data[field])
    }
  }

  if (updates.length === 0) {
    return false
  }

  values.push(data.id)

  const stmt = db.prepare(`
    UPDATE ${table}
    SET ${updates.join(', ')}
    WHERE id = ?
  `)

  stmt.run(...values)

  return true
}
