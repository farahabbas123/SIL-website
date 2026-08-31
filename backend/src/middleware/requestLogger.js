// ============================================================
// requestLogger — one line per request: method, path, status, ms
// Disabled during tests (config.logRequests).
// ============================================================

const config = require('../config');

module.exports = function requestLogger(req, res, next) {
    if (!config.logRequests) return next();

    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const ms = Number(process.hrtime.bigint() - start) / 1e6;
        // eslint-disable-next-line no-console
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`);
    });
    return next();
};
