// ============================================================
// /api/v1/auth
// ============================================================

const { Router } = require('express');
const ctrl = require('./auth.controller');
const requireAuth = require('../../middleware/requireAuth');
const { validateBody } = require('../../middleware/validate');
const schema = require('./auth.validation');

const router = Router();

router.post('/register', validateBody(schema.register), ctrl.register);
router.post('/login', validateBody(schema.login), ctrl.login);
router.post('/logout', requireAuth, ctrl.logout);

router.post(
    '/password-reset',
    validateBody(schema.passwordResetRequest),
    ctrl.requestPasswordReset
);
router.post(
    '/password-reset/confirm',
    validateBody(schema.passwordResetConfirm),
    ctrl.confirmPasswordReset
);

router.post('/verify-email', requireAuth, ctrl.requestEmailVerification);
router.post(
    '/verify-email/confirm',
    validateBody(schema.emailVerifyConfirm),
    ctrl.confirmEmailVerification
);

module.exports = router;
