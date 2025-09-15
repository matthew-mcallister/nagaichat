import runMigrations from '@/lib/backend/migration'
import { Mutex } from 'async-mutex'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { Sequelize } from 'sequelize'

let _db: Sequelize | null = null
const _mutex: Mutex = new Mutex()

async function getDb(): Promise<Sequelize> {
  // XXX: Sadly this caching does *not* work in dev mode. The KVCache works so
  // the bug must have something to do with getDb being called at module level
  if (_db !== null) return _db

  await _mutex.runExclusive(async () => {
    if (_db !== null) return

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
  })

  if (_db === null) throw new Error('unreachable')

  return _db
}

export default getDb
