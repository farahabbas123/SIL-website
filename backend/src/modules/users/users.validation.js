const { rules } = require('../../middleware/validate');
const { ROLES } = require('./users.model');

module.exports = {
    updateProfile: {
        name: [rules.required, rules.string, rules.maxLength(120)],
        email: [rules.required, rules.email, rules.maxLength(200)],
    },
    changePassword: {
        currentPassword: [rules.required, rules.string],
        newPassword: [rules.required, rules.string, rules.minLength(8), rules.maxLength(200)],
    },
    setRole: {
        role: [rules.required, rules.oneOf(ROLES)],
    },
};
