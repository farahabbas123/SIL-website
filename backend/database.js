const path = require('path');
const Database = require('better-sqlite3');

// Allows tests to point at an isolated database (e.g. ":memory:")
// without touching the real database.db file used in development.
const dbFile = process.env.DB_FILE || path.join(__dirname, 'database.db');

const db = new Database(dbFile);

db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    )
`).run();

if (process.env.NODE_ENV !== 'test') {
    console.log(`Database connected (${dbFile}).`);
}

module.exports = db;
