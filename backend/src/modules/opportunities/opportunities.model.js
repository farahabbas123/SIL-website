// ============================================================
// Opportunity model / types
// ------------------------------------------------------------
// Row -> API object mapper. `closingSoon` is COMPUTED here (not
// stored) from the closing date and the configured threshold, so
// it's always current.
// ============================================================

/** @typedef {'undergraduate'|'postgrad-coursework'|'postgrad-research'|'short-course'|'other'} OpportunityType */
const OPPORTUNITY_TYPES = Object.freeze([
    'undergraduate',
    'postgrad-coursework',
    'postgrad-research',
    'short-course',
    'other',
]);

/**
 * @param {string|null} closingDate  'YYYY-MM-DD' or null
 * @param {number} thresholdDays
 * @returns {boolean} true if the date is in the future and within `thresholdDays`
 */
function isClosingSoon(closingDate, thresholdDays) {
    if (!closingDate) return false;
    const closesAt = Date.parse(`${closingDate}T23:59:59Z`);
    if (Number.isNaN(closesAt)) return false;
    const daysLeft = (closesAt - Date.now()) / 86_400_000;
    return daysLeft >= 0 && daysLeft <= thresholdDays;
}

/**
 * @typedef {Object} Opportunity
 * @property {number} id
 * @property {string} name
 * @property {string} location
 * @property {OpportunityType} type
 * @property {string|null} closingDate
 * @property {string} url
 * @property {boolean} closingSoon
 * @property {number|null} createdBy
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 */

/**
 * @param {object} row  raw `opportunities` row
 * @param {{ soonThresholdDays: number }} opts
 * @returns {Opportunity|null}
 */
function toOpportunity(row, opts = { soonThresholdDays: 30 }) {
    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        location: row.location,
        type: row.type,
        closingDate: row.closing_date || null,
        url: row.url,
        closingSoon: isClosingSoon(row.closing_date, opts.soonThresholdDays),
        createdBy: row.created_by || null,
        createdAt: row.created_at || null,
        updatedAt: row.updated_at || null,
    };
}

module.exports = { OPPORTUNITY_TYPES, isClosingSoon, toOpportunity };
