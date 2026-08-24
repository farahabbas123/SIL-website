const Database = require('better-sqlite3');

const db = new Database('database.db');

db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    )
`).run();

console.log('Database connected.');

module.exports = db;