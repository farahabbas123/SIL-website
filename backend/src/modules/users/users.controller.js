// ============================================================
// Users controller — HTTP glue. Reads req, calls the service,
// writes the standard envelope. No business logic here.
// ============================================================

const asyncHandler = require('../../lib/asyncHandler');
const { sendOk } = require('../../lib/response');
const service = require('./users.service');

// ---- self-service (/users/me) ----

const getMe = asyncHandler(async (req, res) => {
    sendOk(res, { user: service.getUser(req.session.userId) });
});

const updateMe = asyncHandler(async (req, res) => {
    const user = service.updateProfile(req.session.userId, {
        name: req.body.name,
        email: req.body.email,
    });
    sendOk(res, { user }, { message: 'Profile updated.' });
});

const changeMyPassword = asyncHandler(async (req, res) => {
    await service.changePassword(req.session.userId, {
        currentPassword: req.body.currentPassword,
        newPassword: req.body.newPassword,
    });
    sendOk(res, null, { message: 'Password updated successfully.' });
});

const deleteMe = asyncHandler(async (req, res) => {
    service.deleteUser(req.session.userId);
    await new Promise((resolve) => req.session.destroy(() => resolve()));
    res.clearCookie('connect.sid');
    sendOk(res, null, { message: 'Account deleted.' });
});

// ---- admin (/users, /users/:id) ----

const listUsers = asyncHandler(async (req, res) => {
    sendOk(res, { users: service.listUsers() });
});

const getUser = asyncHandler(async (req, res) => {
    sendOk(res, { user: service.getUser(Number(req.params.id)) });
});

const setUserRole = asyncHandler(async (req, res) => {
    const user = service.setRole(req.session.userId, Number(req.params.id), req.body.role);
    sendOk(res, { user }, { message: 'Role updated.' });
});

module.exports = {
    getMe,
    updateMe,
    changeMyPassword,
    deleteMe,
    listUsers,
    getUser,
    setUserRole,
};
