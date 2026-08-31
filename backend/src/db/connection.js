// ============================================================
// Database connection (SQLite via better-sqlite3)
// ------------------------------------------------------------
// One shared, synchronous connection for the whole process.
// The schema is NOT created here — it lives in versioned
// migrations (src/db/migrations/*.sql), applied by migrate.js.
//
// Why SQLite: the site is a small, read-mostly opportunities
// board with a single users table. A file-based database means
// zero external services to run, and better-sqlite3 is fast and
// synchronous which keeps the data-access layer simple. The
// repository layer is the only place that talks to it, so
// swapping in Postgres later is a localised change.
// ============================================================

const Database = require('better-sqlite3');
const config = require('../config');

const db = new Database(config.dbFile);

// WAL gives better read/write concurrency; a no-op for ':memory:'.
db.pragma('journal_mode = WAL');
// SQLite has foreign keys OFF by default — turn them on so
// ON DELETE CASCADE / SET NULL in the migrations actually apply.
db.pragma('foreign_keys = ON');

if (!config.isTest) {
    // eslint-disable-next-line no-console
    console.log(`Database connected (${config.dbFile}).`);
}

module.exports = db;
