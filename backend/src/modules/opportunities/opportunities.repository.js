// ============================================================
// Opportunities repository — the ONLY place that runs SQL against
// `opportunities`. Returns raw rows.
// ============================================================

const db = require('../../db/connection');

// Soonest closing date first; rolling-intake (NULL) listings last.
const ORDER = 'ORDER BY (closing_date IS NULL), closing_date ASC, id ASC';

function list({ type } = {}) {
    if (type) {
        return db.prepare(`SELECT * FROM opportunities WHERE type = ? ${ORDER}`).all(type);
    }
    return db.prepare(`SELECT * FROM opportunities ${ORDER}`).all();
}

function findById(id) {
    return db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id);
}

function create(data) {
    const info = db
        .prepare(
            `INSERT INTO opportunities
                (name, location, type, closing_date, url, created_by, created_at, updated_at)
             VALUES
                (@name, @location, @type, @closingDate, @url, @createdBy, datetime('now'), datetime('now'))`
        )
        .run({
            name: data.name,
            location: data.location,
            type: data.type,
            closingDate: data.closingDate ?? null,
            url: data.url,
            createdBy: data.createdBy ?? null,
        });
    return findById(info.lastInsertRowid);
}

/**
 * Partial update. Fields left `undefined` keep their current value;
 * pass `closingDate: null` to explicitly clear the date.
 * @returns updated row, or null if the id doesn't exist
 */
function update(id, data) {
    const current = findById(id);
    if (!current) return null;

    const next = {
        id,
        name: data.name ?? current.name,
        location: data.location ?? current.location,
        type: data.type ?? current.type,
        url: data.url ?? current.url,
        closingDate:
            data.closingDate !== undefined ? data.closingDate : current.closing_date,
    };

    db.prepare(
        `UPDATE opportunities
            SET name = @name, location = @location, type = @type,
                url = @url, closing_date = @closingDate, updated_at = datetime('now')
          WHERE id = @id`
    ).run(next);

    return findById(id);
}

function remove(id) {
    return db.prepare('DELETE FROM opportunities WHERE id = ?').run(id).changes > 0;
}

module.exports = { list, findById, create, update, remove };
