// ============================================================
// Opportunities service — business rules for the board.
// Public reads (list/get), admin-only writes. The `closingSoon`
// flag and the `soon` filter are computed here.
// ============================================================

const config = require('../../config');
const ApiError = require('../../lib/ApiError');
const repo = require('./opportunities.repository');
const { toOpportunity } = require('./opportunities.model');

const mapOpts = { soonThresholdDays: config.soonThresholdDays };

/**
 * @param {{ type?: string, soon?: boolean }} filters
 * @returns {import('./opportunities.model').Opportunity[]}
 */
function listOpportunities({ type, soon } = {}) {
    let items = repo.list({ type }).map((row) => toOpportunity(row, mapOpts));
    if (soon === true) {
        items = items.filter((o) => o.closingSoon);
    }
    return items;
}

function getOpportunity(id) {
    const row = repo.findById(id);
    if (!row) throw ApiError.notFound('Opportunity not found.');
    return toOpportunity(row, mapOpts);
}

function createOpportunity(data, createdBy) {
    const row = repo.create({ ...data, createdBy });
    return toOpportunity(row, mapOpts);
}

function updateOpportunity(id, data) {
    const row = repo.update(id, data);
    if (!row) throw ApiError.notFound('Opportunity not found.');
    return toOpportunity(row, mapOpts);
}

function deleteOpportunity(id) {
    if (!repo.remove(id)) throw ApiError.notFound('Opportunity not found.');
}

module.exports = {
    listOpportunities,
    getOpportunity,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
};
