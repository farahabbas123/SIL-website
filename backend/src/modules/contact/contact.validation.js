const { rules } = require('../../middleware/validate');

// Full payload — the contact form only ever creates, never updates.
const create = {
    name: [rules.required, rules.string, rules.maxLength(200)],
    email: [rules.required, rules.email, rules.maxLength(200)],
    reason: [rules.string, rules.maxLength(200)],
    message: [rules.required, rules.string, rules.maxLength(5000)],
};

module.exports = { create };
