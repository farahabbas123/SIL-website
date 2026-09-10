// ============================================================
// Contact messages repository — the ONLY place that runs SQL
// against `contact_messages`. Returns raw rows.
// ============================================================

const db = require('../../db/connection');

const ORDER = 'ORDER BY id DESC';

function list() {
    return db.prepare(`SELECT * FROM contact_messages ${ORDER}`).all();
}

function findById(id) {
    return db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id);
}

function create(data) {
    const info = db
        .prepare(
            `INSERT INTO contact_messages (name, email, reason, message, created_at)
             VALUES (@name, @email, @reason, @message, datetime('now'))`
        )
        .run({
            name: data.name,
            email: data.email,
            reason: data.reason ?? null,
            message: data.message,
        });
    return findById(info.lastInsertRowid);
}

module.exports = { list, findById, create };
