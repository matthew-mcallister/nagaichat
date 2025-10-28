import { Sequelize, Transaction } from 'sequelize'

async function migrate_v1(db: Sequelize, transaction: Transaction): Promise<void> {
  await db.query(`
    CREATE TABLE integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      interface TEXT NOT NULL,
      apiKey TEXT NOT NULL,
      baseUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER update_integrations_timestamp
    AFTER UPDATE ON integrations
    FOR EACH ROW
    BEGIN
      UPDATE integrations SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `, { transaction })
}

async function migrate_v2(db: Sequelize, transaction: Transaction): Promise<void> {
  await db.query(`
    CREATE TABLE presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      options TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER update_presets_timestamp
    AFTER UPDATE ON presets
    FOR EACH ROW
    BEGIN
      UPDATE presets SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `, { transaction })
}

async function migrate_v3(db: Sequelize, transaction: Transaction): Promise<void> {
  await db.query(`
    CREATE TABLE sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      presetId INTEGER,
      options TEXT NOT NULL,
      latestItemId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (presetId) REFERENCES presets(id) ON DELETE SET NULL,
      FOREIGN KEY (latestItemId) REFERENCES items(id) ON DELETE SET NULL
    );

    CREATE TRIGGER update_sessions_timestamp
    AFTER UPDATE ON sessions
    FOR EACH ROW
    BEGIN
      UPDATE sessions SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `, { transaction })
}

async function migrate_v4(db: Sequelize, transaction: Transaction): Promise<void> {
  await db.query(`
    CREATE TABLE items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId INTEGER NOT NULL,
      parentId INTEGER,
      content TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'model')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (parentId) REFERENCES items(id) ON DELETE SET NULL
    );

    CREATE TRIGGER update_items_timestamp
    AFTER UPDATE ON items
    FOR EACH ROW
    BEGIN
      UPDATE items SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `, { transaction })
}

async function migrate_v5(db: Sequelize, transaction: Transaction): Promise<void> {
  await db.query(`
    CREATE TABLE staticContents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mimeType TEXT NOT NULL,
      sha1Hex TEXT NOT NULL UNIQUE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX staticContents_sha1Hex_unique
    ON staticContents (sha1Hex);

    CREATE TRIGGER update_staticContents_timestamp
    AFTER UPDATE ON staticContents
    FOR EACH ROW
    BEGIN
      UPDATE staticContents SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `, { transaction })
}

async function migrate_v6(db: Sequelize, transaction: Transaction): Promise<void> {
  await db.query(`
    CREATE TABLE contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemId INTEGER NOT NULL REFERENCES items (id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      text TEXT,
      staticContentId INTEGER REFERENCES staticContents (id) ON DELETE SET NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO contents (itemId, type, text)
    SELECT it.id, 'text', json_extract(it.content, '$[0].text')
    FROM items it;
    ALTER TABLE ITEMS DROP COLUMN content;

    CREATE TRIGGER update_contents_timestamp
    AFTER UPDATE ON contents
    FOR EACH ROW
    BEGIN
      UPDATE contents SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `, { transaction })
}

export default async function runMigrations(db: Sequelize): Promise<void> {
  const [result, _]: [any, unknown] = await db.query('PRAGMA user_version')
  const currentVersion = result[0].user_version as number

  console.log('current schema version:', currentVersion)

  const migrations = [
    migrate_v1,
    migrate_v2,
    migrate_v3,
    migrate_v4,
    migrate_v5,
    migrate_v6,
  ]

  // Run migrations that haven't been applied yet
  for (let i = currentVersion; i < migrations.length; i++) {
    console.log('running migration version:', i + 1)

    const transaction = await db.transaction()

    await migrations[i](db, transaction)
    await db.query(`PRAGMA user_version = ${i + 1}`, { transaction })

    transaction.commit()
  }
}
