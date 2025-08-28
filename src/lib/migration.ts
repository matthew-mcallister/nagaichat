import { Database } from 'better-sqlite3'

function migrate_v1(db: Database): void {
    console.log('running migration v1')

    db.exec(`
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
    `)
}

export default function runMigrations(db: Database): void {
    const currentVersion = db.pragma('user_version', { simple: true }) as number

    console.log('current schema version: ', currentVersion)

    const migrations = [
        migrate_v1
    ]

    // Run migrations that haven't been applied yet
    for (let i = currentVersion; i < migrations.length; i++) {
        const transaction = db.transaction(() => {
            migrations[i](db)
            db.pragma(`user_version = ${i + 1}`)
        })

        transaction()
    }
}