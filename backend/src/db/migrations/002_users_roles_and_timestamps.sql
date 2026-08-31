-- Add role-based access, email verification, and audit timestamps
-- to users.
--
-- Note: SQLite's ALTER TABLE ADD COLUMN only accepts a *constant*
-- default, so the timestamp columns are added nullable and then
-- backfilled. From here on the repository always writes
-- created_at / updated_at explicitly.

ALTER TABLE users ADD COLUMN role           TEXT    NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN created_at     TEXT;
ALTER TABLE users ADD COLUMN updated_at     TEXT;

UPDATE users
   SET created_at = COALESCE(created_at, datetime('now')),
       updated_at = COALESCE(updated_at, datetime('now'));

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
