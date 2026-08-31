// ============================================================
// Users repository — the ONLY place that runs SQL against `users`.
// Returns raw rows (including password_hash); callers in the
// service layer decide what to expose.
// ============================================================

const db = require('../../db/connection');

function findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

/** @returns {boolean} whether an account with this email exists (optionally excluding one id). */
function existsByEmail(email, exceptId = null) {
    const row =
        exceptId != null
            ? db.prepare('SELECT 1 FROM users WHERE email = ? AND id != ?').get(email, exceptId)
            : db.prepare('SELECT 1 FROM users WHERE email = ?').get(email);
    return Boolean(row);
}

function list() {
    return db.prepare('SELECT * FROM users ORDER BY id ASC').all();
}

function create({ name, email, passwordHash, role = 'user', emailVerified = 0 }) {
    const info = db
        .prepare(
            `INSERT INTO users (name, email, password_hash, role, email_verified, created_at, updated_at)
             VALUES (@name, @email, @passwordHash, @role, @emailVerified, datetime('now'), datetime('now'))`
        )
        .run({ name, email, passwordHash, role, emailVerified });
    return findById(info.lastInsertRowid);
}

function updateProfile(id, { name, email }) {
    db.prepare(
        `UPDATE users SET name = @name, email = @email, updated_at = datetime('now') WHERE id = @id`
    ).run({ id, name, email });
    return findById(id);
}

function updatePassword(id, passwordHash) {
    db.prepare(
        `UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(passwordHash, id);
}

function updateRole(id, role) {
    db.prepare(`UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?`).run(role, id);
    return findById(id);
}

function markEmailVerified(id) {
    db.prepare(
        `UPDATE users SET email_verified = 1, updated_at = datetime('now') WHERE id = ?`
    ).run(id);
}

function remove(id) {
    return db.prepare('DELETE FROM users WHERE id = ?').run(id).changes > 0;
}

module.exports = {
    findById,
    findByEmail,
    existsByEmail,
    list,
    create,
    updateProfile,
    updatePassword,
    updateRole,
    markEmailVerified,
    remove,
};
