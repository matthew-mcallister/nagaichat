import { Sequelize, Transaction } from 'sequelize'

async function migrate_v1(db: Sequelize, transaction: Transaction): Promise<void> {
    await db.query(`
        CREATE TABLE integrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            interface TEXT NOT NULL CHECK (interface IN ('openai', 'gemini')),
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

export default async function runMigrations(db: Sequelize): Promise<void> {
    const [result, _]: [any, unknown] = await db.query('PRAGMA user_version')
    const currentVersion = result[0].user_version as number

    console.log('current schema version:', currentVersion)

    const migrations = [
        migrate_v1,
        migrate_v2
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
