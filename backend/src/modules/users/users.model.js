// ============================================================
// User model / types
// ------------------------------------------------------------
// Shape constants and the row -> public-object mapper. The
// repository returns raw DB rows (snake_case, incl. password_hash);
// everything that leaves the service goes through toPublicUser so
// the hash never escapes.
// ============================================================

/** @typedef {'user'|'admin'} Role */
const ROLES = Object.freeze(['user', 'admin']);

/**
 * @typedef {Object} PublicUser
 * @property {number}  id
 * @property {string}  name
 * @property {string}  email
 * @property {Role}    role
 * @property {boolean} emailVerified
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 */

/**
 * @param {object} row  raw `users` row
 * @returns {PublicUser|null}
 */
function toPublicUser(row) {
    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role || 'user',
        emailVerified: Boolean(row.email_verified),
        createdAt: row.created_at || null,
        updatedAt: row.updated_at || null,
    };
}

module.exports = { ROLES, toPublicUser };
