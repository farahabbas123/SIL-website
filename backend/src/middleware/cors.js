// ============================================================
// CORS — hand-rolled (no dependency)
// ------------------------------------------------------------
// In normal use the backend serves the frontend from the same
// origin, so CORS isn't exercised. It matters when the frontend
// runs on a separate dev server (e.g. Vite on :5173).
//
//   CORS_ORIGINS=*                      -> any origin, no cookies
//   CORS_ORIGINS=http://localhost:5173  -> that origin, with cookies
// ============================================================

const config = require('../config');

module.exports = function cors(req, res, next) {
    const origin = req.headers.origin;
    const allowAll = config.corsOrigins.includes('*');

    if (origin && config.corsOrigins.includes(origin)) {
        // Explicitly allow-listed → safe to allow credentials (cookies).
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (allowAll) {
        // Wildcard → cannot combine with credentials per the CORS spec.
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '600');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    return next();
};
