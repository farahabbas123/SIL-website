// ============================================================
// Users service — business rules for accounts.
// Talks to the repository, hashes passwords, enforces uniqueness
// and self-service constraints, and returns public user objects
// (never the password hash).
// ============================================================

const bcrypt = require('bcrypt');
const config = require('../../config');
const ApiError = require('../../lib/ApiError');
const repo = require('./users.repository');
const { toPublicUser, ROLES } = require('./users.model');

async function createUser({ name, email, password, role = 'user' }) {
    if (repo.existsByEmail(email)) {
        throw ApiError.conflict('An account with this email already exists.');
    }
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    return toPublicUser(repo.create({ name, email, passwordHash, role }));
}

function getUser(id) {
    const row = repo.findById(id);
    if (!row) throw ApiError.notFound('User not found.');
    return toPublicUser(row);
}

function listUsers() {
    return repo.list().map(toPublicUser);
}

function updateProfile(id, { name, email }) {
    if (repo.existsByEmail(email, id)) {
        throw ApiError.conflict('That email is already in use.');
    }
    return toPublicUser(repo.updateProfile(id, { name, email }));
}

async function changePassword(id, { currentPassword, newPassword }) {
    const row = repo.findById(id);
    if (!row) throw ApiError.notFound('User not found.');

    const matches = await bcrypt.compare(currentPassword, row.password_hash);
    if (!matches) throw ApiError.unauthorized('Current password is incorrect.');

    repo.updatePassword(id, await bcrypt.hash(newPassword, config.bcryptRounds));
}

/** Used by the password-reset flow — no current-password check. */
async function setPassword(id, newPassword) {
    if (!repo.findById(id)) throw ApiError.notFound('User not found.');
    repo.updatePassword(id, await bcrypt.hash(newPassword, config.bcryptRounds));
}

function deleteUser(id) {
    if (!repo.remove(id)) throw ApiError.notFound('User not found.');
}

function setRole(actingUserId, targetUserId, role) {
    if (!ROLES.includes(role)) {
        throw ApiError.badRequest(`role must be one of: ${ROLES.join(', ')}`);
    }
    if (!repo.findById(targetUserId)) throw ApiError.notFound('User not found.');
    if (actingUserId === targetUserId && role !== 'admin') {
        throw ApiError.badRequest("You can't remove your own admin role.");
    }
    return toPublicUser(repo.updateRole(targetUserId, role));
}

function markEmailVerified(id) {
    repo.markEmailVerified(id);
}

module.exports = {
    createUser,
    getUser,
    listUsers,
    updateProfile,
    changePassword,
    setPassword,
    deleteUser,
    setRole,
    markEmailVerified,
};
