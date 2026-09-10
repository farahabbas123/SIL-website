// ============================================================
// Contact message model — row -> API object mapper.
// ============================================================

/**
 * @typedef {Object} ContactMessage
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {string|null} reason
 * @property {string} message
 * @property {string|null} createdAt
 */

/**
 * @param {object} row  raw `contact_messages` row
 * @returns {ContactMessage|null}
 */
function toContactMessage(row) {
    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        reason: row.reason || null,
        message: row.message,
        createdAt: row.created_at || null,
    };
}

module.exports = { toContactMessage };
