import runMigrations from '@/lib/backend/migration'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { Sequelize } from 'sequelize'

let _db: Sequelize | null = null

async function getDb(): Promise<Sequelize> {
  if (_db != null) return _db

  const SQLITE_PATH = process.env.SQLITE_PATH || './db.sqlite'

  const dbDir = dirname(SQLITE_PATH)
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  const db = new Sequelize({
    dialect: 'sqlite',
    storage: SQLITE_PATH,
  })
  await db.query('PRAGMA journal_mode = WAL')
  await db.query('PRAGMA foreign_keys = ON')

  await runMigrations(db)

  _db = db

  return db
}

export default getDb
