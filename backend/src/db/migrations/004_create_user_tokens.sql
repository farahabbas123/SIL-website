-- Single-use, expiring tokens for password reset and email
-- verification. Only the SHA-256 hash of the token is stored;
-- the raw token is emailed to the user and never persisted.

CREATE TABLE IF NOT EXISTS user_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type       TEXT NOT NULL CHECK (type IN ('password_reset', 'email_verify')),
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,          -- ISO timestamp
    used_at    TEXT,                   -- set when consumed; NULL means still valid
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_tokens_hash   ON user_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_user_tokens_lookup ON user_tokens (user_id, type);
