// Creates a test account so you can sign in straight away without
// going through the signup form. Not for production use — the
// password is intentionally weak and skips the normal 8-character rule
// (that rule only applies to the /api/signup endpoint, not this script).
//
//   Email:    1@gmail.com
//   Password: 1
//
// Run directly:   node seed.js   (or  npm run seed)
// Import in tests: const { seedTestUser } = require('./seed');

const bcrypt = require('bcrypt');
const db = require('./database');

const TEST_USER = {
    name: 'Test User',
    email: '1@gmail.com',
    password: '1'
};

async function seedTestUser() {
    const existing = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(TEST_USER.email);

    if (existing) {
        return existing;
    }

    const passwordHash = await bcrypt.hash(TEST_USER.password, 12);

    const result = db.prepare(`
        INSERT INTO users (name, email, password_hash)
        VALUES (?, ?, ?)
    `).run(TEST_USER.name, TEST_USER.email, passwordHash);

    return { id: result.lastInsertRowid, name: TEST_USER.name, email: TEST_USER.email };
}

module.exports = { seedTestUser, TEST_USER };

if (require.main === module) {
    seedTestUser()
        .then((user) => {
            console.log(`Test user ready: ${TEST_USER.email} / ${TEST_USER.password} (id ${user.id})`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('Failed to seed test user:', error);
            process.exit(1);
        });
}
