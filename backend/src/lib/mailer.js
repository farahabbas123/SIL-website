// ============================================================
// mailer — outbound email
// ------------------------------------------------------------
// DEV STUB: this logs the message to the console instead of
// sending it. Password-reset and email-verification flows also
// return the token in the API response when NODE_ENV !== 'production'
// so you can test them without a mail server.
//
// For production, replace sendMail() with a real transport
// (nodemailer + SMTP, AWS SES, Postmark, Resend, …). Keep the
// same signature and the rest of the app doesn't change.
// ============================================================

const config = require('../config');

/**
 * @param {object} msg
 * @param {string} msg.to
 * @param {string} msg.subject
 * @param {string} msg.text
 */
async function sendMail({ to, subject, text }) {
    if (config.isTest) return;
    // eslint-disable-next-line no-console
    console.log(
        `\n[mailer] (dev stub — not actually sent)\n` +
        `  to:      ${to}\n` +
        `  subject: ${subject}\n` +
        `  body:    ${text}\n`
    );
}

module.exports = { sendMail };
