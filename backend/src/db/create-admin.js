// ============================================================
// One-off script: create a new admin, or promote an existing
// account to admin (and reset its password).
//
//   node src/db/create-admin.js <email> <password> ["Full Name"]
//
// Meant for bootstrapping the first admin on a fresh deployment,
// where no admin exists yet to use PATCH /api/v1/users/:id/role.
// ============================================================

require('dotenv').config();
const bcrypt = require('bcrypt');
const config = require('../config');
const db = require('./connection');
const { runMigrations } = require('./migrate');

async function main() {
    const [, , email, password, name = 'Admin'] = process.argv;
    if (!email || !password) {
        console.error('Usage: node src/db/create-admin.js <email> <password> ["Full Name"]');
        process.exit(1);
    }
    if (password.length < 8) {
        console.error('Password must be at least 8 characters.');
        process.exit(1);
    }

    runMigrations({ silent: true });

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

    if (existing) {
        db.prepare(
            `UPDATE users SET password_hash = ?, role = 'admin', email_verified = 1, updated_at = datetime('now') WHERE id = ?`
        ).run(passwordHash, existing.id);
        console.log(`Promoted existing user ${email} to admin and updated their password.`);
    } else {
        db.prepare(
            `INSERT INTO users (name, email, password_hash, role, email_verified, created_at, updated_at)
             VALUES (?, ?, ?, 'admin', 1, datetime('now'), datetime('now'))`
        ).run(name, email, passwordHash);
        console.log(`Created admin user ${email}.`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Failed:', err);
        process.exit(1);
    });
