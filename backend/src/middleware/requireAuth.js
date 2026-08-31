// ============================================================
// requireAuth — block a route unless the request has a signed-in
// session. Populates nothing; handlers read req.session.userId.
// ============================================================

const ApiError = require('../lib/ApiError');

module.exports = function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return next(ApiError.unauthorized());
    }
    return next();
};
