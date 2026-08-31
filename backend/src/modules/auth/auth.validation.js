const { rules } = require('../../middleware/validate');

module.exports = {
    register: {
        name: [rules.required, rules.string, rules.maxLength(120)],
        email: [rules.required, rules.email, rules.maxLength(200)],
        password: [rules.required, rules.string, rules.minLength(8), rules.maxLength(200)],
    },
    login: {
        email: [rules.required, rules.email],
        password: [rules.required, rules.string],
    },
    passwordResetRequest: {
        email: [rules.required, rules.email],
    },
    passwordResetConfirm: {
        token: [rules.required, rules.string],
        newPassword: [rules.required, rules.string, rules.minLength(8), rules.maxLength(200)],
    },
    emailVerifyConfirm: {
        token: [rules.required, rules.string],
    },
};
