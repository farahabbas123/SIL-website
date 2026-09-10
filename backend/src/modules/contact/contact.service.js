// ============================================================
// Contact service — persists every submission, then notifies the
// team via mailer (dev stub logs to the console — see lib/mailer).
// ============================================================

const config = require('../../config');
const ApiError = require('../../lib/ApiError');
const { sendMail } = require('../../lib/mailer');
const repo = require('./contact.repository');
const { toContactMessage } = require('./contact.model');

async function createMessage(data) {
    const row = repo.create(data);
    const contactMessage = toContactMessage(row);

    await sendMail({
        to: config.contactRecipientEmail,
        subject: `New contact form message: ${contactMessage.reason || 'General question'}`,
        text: `From: ${contactMessage.name} <${contactMessage.email}>\n\n${contactMessage.message}`,
    });

    return contactMessage;
}

function listMessages() {
    return repo.list().map(toContactMessage);
}

function getMessage(id) {
    const row = repo.findById(id);
    if (!row) throw ApiError.notFound('Contact message not found.');
    return toContactMessage(row);
}

module.exports = { createMessage, listMessages, getMessage };
