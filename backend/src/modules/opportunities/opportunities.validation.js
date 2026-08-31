const { rules, partial } = require('../../middleware/validate');
const { OPPORTUNITY_TYPES } = require('./opportunities.model');

// Full payload — used by POST and PUT.
const create = {
    name: [rules.required, rules.string, rules.maxLength(200)],
    location: [rules.required, rules.string, rules.maxLength(200)],
    type: [rules.required, rules.oneOf(OPPORTUNITY_TYPES)],
    url: [rules.required, rules.url, rules.maxLength(500)],
    closingDate: [rules.isoDate], // optional; null/'' allowed
};

module.exports = {
    create,
    // PATCH — same rules minus `required` on every field.
    patch: partial(create),
};
