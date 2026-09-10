// ============================================================
// Contact controller — HTTP glue.
// ============================================================

const asyncHandler = require('../../lib/asyncHandler');
const { sendOk } = require('../../lib/response');
const service = require('./contact.service');

const create = asyncHandler(async (req, res) => {
    const contactMessage = await service.createMessage({
        name: req.body.name,
        email: req.body.email,
        reason: req.body.reason || null,
        message: req.body.message,
    });
    sendOk(res, { contactMessage }, { status: 201, message: 'Message sent — we will be in touch soon.' });
});

const list = asyncHandler(async (req, res) => {
    const messages = service.listMessages();
    sendOk(res, { messages }, { meta: { count: messages.length } });
});

const getOne = asyncHandler(async (req, res) => {
    sendOk(res, { contactMessage: service.getMessage(Number(req.params.id)) });
});

module.exports = { create, list, getOne };
