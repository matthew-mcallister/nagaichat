import runMigrations from '@/lib/migration'
import DatabaseConstructor, {Database} from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'

declare global {
  let _sqlite_db: Database | null
}

let _sqlite_db: Database | null = null

function getDb(): Database {
  if (_sqlite_db != null) return _sqlite_db

  const SQLITE_PATH = process.env.SQLITE_PATH || './db.sqlite'

  const dbDir = dirname(SQLITE_PATH)
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  const db = new DatabaseConstructor(SQLITE_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations(db)

  _sqlite_db = db

  return db
}

export default getDb
