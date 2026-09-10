-- Contact form submissions. The form itself never emails directly;
-- the API persists each message here and notifies the team via mailer.

CREATE TABLE IF NOT EXISTS contact_messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    reason     TEXT,
    message    TEXT NOT NULL,
    created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages (created_at);
