-- Postgraduate Opportunities board — the site's priority feature.
-- One row per scholarship / programme listing. Applications happen
-- on the provider's own site, so `url` is the outbound link.

CREATE TABLE IF NOT EXISTS opportunities (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    location     TEXT NOT NULL,
    type         TEXT NOT NULL CHECK (type IN (
                     'undergraduate',
                     'postgrad-coursework',
                     'postgrad-research',
                     'short-course',
                     'other'
                 )),
    closing_date TEXT,                 -- ISO 'YYYY-MM-DD', nullable (rolling intake)
    url          TEXT NOT NULL,        -- absolute URL to the official provider page
    created_by   INTEGER REFERENCES users (id) ON DELETE SET NULL,
    created_at   TEXT,
    updated_at   TEXT
);

CREATE INDEX IF NOT EXISTS idx_opportunities_type         ON opportunities (type);
CREATE INDEX IF NOT EXISTS idx_opportunities_closing_date ON opportunities (closing_date);
