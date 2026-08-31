-- Users table — mirrors the original hand-created schema so an
-- existing database.db upgrades cleanly and a fresh one matches.

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);
