// ============================================================
// Opportunities controller — HTTP glue.
// ============================================================

const asyncHandler = require('../../lib/asyncHandler');
const { sendOk } = require('../../lib/response');
const service = require('./opportunities.service');

const list = asyncHandler(async (req, res) => {
    const opportunities = service.listOpportunities({
        type: req.query.type || undefined,
        soon: req.query.soon === 'true',
    });
    sendOk(res, { opportunities }, { meta: { count: opportunities.length } });
});

const getOne = asyncHandler(async (req, res) => {
    sendOk(res, { opportunity: service.getOpportunity(Number(req.params.id)) });
});

const create = asyncHandler(async (req, res) => {
    const opportunity = service.createOpportunity(
        {
            name: req.body.name,
            location: req.body.location,
            type: req.body.type,
            url: req.body.url,
            closingDate: req.body.closingDate ?? null,
        },
        req.session.userId
    );
    sendOk(res, { opportunity }, { status: 201, message: 'Opportunity created.' });
});

const update = asyncHandler(async (req, res) => {
    // Only forward keys the client actually sent, so PATCH stays partial.
    const patch = {};
    for (const key of ['name', 'location', 'type', 'url', 'closingDate']) {
        if (key in req.body) patch[key] = req.body[key];
    }
    const opportunity = service.updateOpportunity(Number(req.params.id), patch);
    sendOk(res, { opportunity }, { message: 'Opportunity updated.' });
});

const remove = asyncHandler(async (req, res) => {
    service.deleteOpportunity(Number(req.params.id));
    sendOk(res, null, { message: 'Opportunity deleted.' });
});

module.exports = { list, getOne, create, update, remove };
