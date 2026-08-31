// ============================================================
// Migration runner
// ------------------------------------------------------------
// Applies every *.sql file in ./migrations that hasn't been
// applied yet, in filename order, each in its own transaction.
// Applied files are recorded in the _migrations table so re-runs
// are safe (idempotent).
//
//   node src/db/migrate.js      # apply pending migrations (CLI)
//   require('./migrate').runMigrations()   # from server.js / tests
// ============================================================

const fs = require('fs');
const path = require('path');
const db = require('./connection');
const config = require('../config');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function ensureMigrationsTable() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT NOT NULL UNIQUE,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    `);
}

function appliedSet() {
    return new Set(db.prepare('SELECT name FROM _migrations').all().map((r) => r.name));
}

function migrationFiles() {
    if (!fs.existsSync(MIGRATIONS_DIR)) return [];
    return fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort(); // 001_, 002_, … apply in order
}

/**
 * @param {object} [opts]
 * @param {boolean} [opts.silent] suppress console output (default: true in tests)
 * @returns {{applied: string[]}}
 */
function runMigrations({ silent = config.isTest } = {}) {
    ensureMigrationsTable();
    const done = appliedSet();
    const pending = migrationFiles().filter((f) => !done.has(f));

    if (pending.length === 0) {
        if (!silent) console.log('Migrations: already up to date.');
        return { applied: [] };
    }

    const applied = [];
    for (const file of pending) {
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
        const tx = db.transaction(() => {
            db.exec(sql);
            db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
        });
        tx();
        applied.push(file);
        if (!silent) console.log(`Migrations: applied ${file}`);
    }
    return { applied };
}

module.exports = { runMigrations };

if (require.main === module) {
    const { applied } = runMigrations({ silent: false });
    console.log(applied.length ? `Done — ${applied.length} migration(s) applied.` : 'Nothing to apply.');
    process.exit(0);
}
