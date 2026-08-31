// ============================================================
// requireRole('admin', ...) — block a route unless the signed-in
// user's role is one of the allowed roles. Loads the user row and
// attaches it as req.user for the handler.
// ============================================================

const ApiError = require('../lib/ApiError');
const usersRepository = require('../modules/users/users.repository');

module.exports = function requireRole(...allowedRoles) {
    return function roleGuard(req, res, next) {
        if (!req.session || !req.session.userId) {
            return next(ApiError.unauthorized());
        }
        const user = usersRepository.findById(req.session.userId);
        if (!user || !allowedRoles.includes(user.role)) {
            return next(ApiError.forbidden());
        }
        req.user = user;
        return next();
    };
};
