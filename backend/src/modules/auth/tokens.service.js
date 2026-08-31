// ============================================================
// Single-use token service (password reset + email verification)
// ------------------------------------------------------------
// issue()   -> creates a row, returns the RAW token (email this)
// consume() -> validates + marks used, returns the user id or null
//
// Only the SHA-256 hash is stored, so a leaked database row can't
// be used to reset an account.
// ============================================================

const crypto = require('crypto');
const db = require('../../db/connection');
const config = require('../../config');

/** @typedef {'password_reset'|'email_verify'} TokenType */

const hash = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

/**
 * @param {number} userId
 * @param {TokenType} type
 * @returns {string} the raw token to send to the user
 */
function issue(userId, type) {
    const raw = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + config.tokenTtlMinutes * 60_000).toISOString();

    // Invalidate any earlier unused tokens of the same type for this user.
    db.prepare(
        `UPDATE user_tokens SET used_at = datetime('now')
         WHERE user_id = ? AND type = ? AND used_at IS NULL`
    ).run(userId, type);

    db.prepare(
        `INSERT INTO user_tokens (user_id, type, token_hash, expires_at)
         VALUES (?, ?, ?, ?)`
    ).run(userId, type, hash(raw), expiresAt);

    return raw;
}

/**
 * @param {string} rawToken
 * @param {TokenType} type
 * @returns {number|null} the user id if the token was valid, else null
 */
function consume(rawToken, type) {
    if (!rawToken) return null;

    const row = db
        .prepare(
            `SELECT * FROM user_tokens
             WHERE token_hash = ? AND type = ? AND used_at IS NULL`
        )
        .get(hash(rawToken), type);

    if (!row) return null;
    if (Date.parse(row.expires_at) < Date.now()) return null;

    db.prepare(`UPDATE user_tokens SET used_at = datetime('now') WHERE id = ?`).run(row.id);
    return row.user_id;
}

module.exports = { issue, consume };
