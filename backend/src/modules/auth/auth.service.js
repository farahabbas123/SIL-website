// ============================================================
// Auth service — credential verification.
// Account creation lives in the users service; this module only
// handles "is this email + password correct".
// ============================================================

const bcrypt = require('bcrypt');
const ApiError = require('../../lib/ApiError');
const usersRepository = require('../users/users.repository');
const { toPublicUser } = require('../users/users.model');

/**
 * @returns {import('../users/users.model').PublicUser}
 * @throws {ApiError} 401 if the email is unknown or the password is wrong
 */
async function authenticate(email, password) {
    const row = usersRepository.findByEmail(email);
    // Same error whether the email exists or not — no account enumeration.
    if (!row) throw ApiError.unauthorized('Incorrect email or password.');

    const matches = await bcrypt.compare(password, row.password_hash);
    if (!matches) throw ApiError.unauthorized('Incorrect email or password.');

    return toPublicUser(row);
}

module.exports = { authenticate };
