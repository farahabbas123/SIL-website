// ============================================================
// Auth controller — register, login, logout, and the
// password-reset / email-verification token flows.
//
// Sessions: register and login set req.session.userId; logout
// destroys the session. (Swap-in note: to move to JWT, issue a
// token here instead of writing the session.)
// ============================================================

const asyncHandler = require('../../lib/asyncHandler');
const { sendOk } = require('../../lib/response');
const ApiError = require('../../lib/ApiError');
const config = require('../../config');
const { sendMail } = require('../../lib/mailer');

const usersService = require('../users/users.service');
const usersRepository = require('../users/users.repository');
const authService = require('./auth.service');
const tokens = require('./tokens.service');

// ---------- register / login / logout ----------

const register = asyncHandler(async (req, res) => {
    const user = await usersService.createUser({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: 'user',
    });
    req.session.userId = user.id; // signing up also signs you in
    sendOk(res, { user }, { status: 201, message: 'Account created successfully.' });
});

const login = asyncHandler(async (req, res) => {
    const user = await authService.authenticate(req.body.email, req.body.password);
    req.session.userId = user.id;
    sendOk(res, { user }, { message: 'Signed in successfully.' });
});

const logout = asyncHandler(async (req, res) => {
    await new Promise((resolve, reject) => {
        req.session.destroy((err) => (err ? reject(err) : resolve()));
    });
    res.clearCookie('connect.sid');
    sendOk(res, null, { message: 'Signed out successfully.' });
});

// ---------- password reset ----------

const requestPasswordReset = asyncHandler(async (req, res) => {
    const row = usersRepository.findByEmail(req.body.email);
    const body = { message: 'If that email is registered, a reset link is on its way.' };

    if (row) {
        const rawToken = tokens.issue(row.id, 'password_reset');
        await sendMail({
            to: row.email,
            subject: 'Reset your Step Into INTL Law password',
            text:
                `Use this token within ${config.tokenTtlMinutes} minutes to reset your password:\n\n` +
                `${rawToken}\n`,
        });
        // Dev convenience: hand back the token so flows are testable without email.
        if (!config.isProd) body.devToken = rawToken;
    }

    // Always 200, whether or not the email exists — no account enumeration.
    sendOk(res, body);
});

const confirmPasswordReset = asyncHandler(async (req, res) => {
    const userId = tokens.consume(req.body.token, 'password_reset');
    if (!userId) throw ApiError.badRequest('That reset token is invalid or has expired.');

    await usersService.setPassword(userId, req.body.newPassword);
    sendOk(res, null, { message: 'Password updated. You can now sign in.' });
});

// ---------- email verification ----------

const requestEmailVerification = asyncHandler(async (req, res) => {
    const row = usersRepository.findById(req.session.userId);
    const rawToken = tokens.issue(row.id, 'email_verify');
    await sendMail({
        to: row.email,
        subject: 'Verify your Step Into INTL Law email',
        text: `Use this token within ${config.tokenTtlMinutes} minutes to verify your email:\n\n${rawToken}\n`,
    });

    const body = { message: 'Verification email sent.' };
    if (!config.isProd) body.devToken = rawToken;
    sendOk(res, body);
});

const confirmEmailVerification = asyncHandler(async (req, res) => {
    const userId = tokens.consume(req.body.token, 'email_verify');
    if (!userId) throw ApiError.badRequest('That verification token is invalid or has expired.');

    usersService.markEmailVerified(userId);
    sendOk(res, null, { message: 'Email verified.' });
});

module.exports = {
    register,
    login,
    logout,
    requestPasswordReset,
    confirmPasswordReset,
    requestEmailVerification,
    confirmEmailVerification,
};
