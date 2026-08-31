// ============================================================
// Seed / test data
// ------------------------------------------------------------
//   node src/db/seed.js        # CLI: ensure test + admin users and sample opportunities
//   require('./seed')          # tests import individual helpers
//
// Everything here is idempotent — running it twice does nothing
// the second time.
// ============================================================

const bcrypt = require('bcrypt');
const config = require('../config');
const db = require('./connection');
const { runMigrations } = require('./migrate');

// Deliberately weak credentials — dev convenience only. The
// /auth/register endpoint still enforces the 8-char minimum.
const TEST_USER = { name: 'Test User', email: '1@gmail.com', password: '1', role: 'user' };
const ADMIN_USER = { name: 'SIL Admin', email: 'admin@sil.test', password: 'admin1234', role: 'admin' };

// A few real listings from the spec so the board isn't empty.
const SAMPLE_OPPORTUNITIES = [
    {
        name: 'Rhodes Scholarship',
        location: 'University of Oxford, UK',
        type: 'postgrad-research',
        closingDate: '2027-08-03',
        url: 'https://www.rhodeshouse.ox.ac.uk/scholarships/',
    },
    {
        name: 'Chevening Scholarship',
        location: 'United Kingdom (various universities)',
        type: 'postgrad-coursework',
        closingDate: '2027-11-05',
        url: 'https://www.chevening.org/scholarships/',
    },
    {
        name: 'Fulbright Foreign Student Program',
        location: 'United States (various universities)',
        type: 'postgrad-coursework',
        closingDate: null,
        url: 'https://foreign.fulbrightonline.org/',
    },
    {
        name: 'DAAD Study Scholarship',
        location: 'Germany (various universities)',
        type: 'postgrad-coursework',
        closingDate: '2027-10-15',
        url: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
    },
    {
        name: 'Hague Academy Summer Course on Public International Law',
        location: 'The Hague, Netherlands',
        type: 'short-course',
        closingDate: '2027-01-31',
        url: 'https://www.hagueacademy.nl/',
    },
    {
        name: 'ANU Master of International Law',
        location: 'Australian National University, Australia',
        type: 'postgrad-coursework',
        closingDate: null,
        url: 'https://programsandcourses.anu.edu.au/program/MILAW',
    },
];

/** Insert a user if one with that email doesn't already exist. */
async function upsertUser(u) {
    const existing = db
        .prepare('SELECT id, name, email, role FROM users WHERE email = ?')
        .get(u.email);
    if (existing) return existing;

    const passwordHash = await bcrypt.hash(u.password, config.bcryptRounds);
    const info = db
        .prepare(
            `INSERT INTO users (name, email, password_hash, role, email_verified, created_at, updated_at)
             VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
        )
        .run(u.name, u.email, passwordHash, u.role);
    return { id: info.lastInsertRowid, name: u.name, email: u.email, role: u.role };
}

/** @returns the seeded (or existing) test user row. */
function seedTestUser() {
    return upsertUser(TEST_USER);
}

/** @returns the seeded (or existing) admin user row. */
function seedAdminUser() {
    return upsertUser(ADMIN_USER);
}

/** Insert the sample opportunities, but only if the table is empty. */
function seedOpportunities(createdBy = null) {
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM opportunities').get();
    if (n > 0) return { inserted: 0 };

    const insert = db.prepare(
        `INSERT INTO opportunities (name, location, type, closing_date, url, created_by, created_at, updated_at)
         VALUES (@name, @location, @type, @closingDate, @url, @createdBy, datetime('now'), datetime('now'))`
    );
    const insertMany = db.transaction((rows) => {
        for (const r of rows) {
            insert.run({
                name: r.name,
                location: r.location,
                type: r.type,
                closingDate: r.closingDate ?? null,
                url: r.url,
                createdBy,
            });
        }
    });
    insertMany(SAMPLE_OPPORTUNITIES);
    return { inserted: SAMPLE_OPPORTUNITIES.length };
}

/** Run migrations, then seed everything. Used by the CLI. */
async function seedAll() {
    runMigrations({ silent: true });
    const test = await seedTestUser();
    const admin = await seedAdminUser();
    const opportunities = seedOpportunities(admin.id);
    return { test, admin, opportunities };
}

async function runCli() {
    const { test, admin, opportunities } = await seedAll();
    // eslint-disable-next-line no-console
    console.log(
        `Seed complete:\n` +
        `  test user   ${TEST_USER.email} / ${TEST_USER.password}   (id ${test.id}, role ${test.role})\n` +
        `  admin user  ${ADMIN_USER.email} / ${ADMIN_USER.password}   (id ${admin.id}, role ${admin.role})\n` +
        `  opportunities inserted: ${opportunities.inserted}`
    );
}

module.exports = {
    TEST_USER,
    ADMIN_USER,
    SAMPLE_OPPORTUNITIES,
    seedTestUser,
    seedAdminUser,
    seedOpportunities,
    seedAll,
    runCli,
};

if (require.main === module) {
    runCli()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Seed failed:', err);
            process.exit(1);
        });
}
