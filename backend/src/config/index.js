// ============================================================
// Central configuration
// ------------------------------------------------------------
// Every environment-dependent value the app needs is resolved
// here once, with sensible development defaults. Import this
// module anywhere instead of reading process.env directly.
// ============================================================

const path = require('path');

const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';
const isTest = env === 'test';

/**
 * In production a handful of values must be set explicitly.
 * Fail fast on boot rather than silently running insecure.
 */
function requireInProd(name, value) {
    if (isProd && (value === undefined || value === '')) {
        throw new Error(`Missing required environment variable in production: ${name}`);
    }
    return value;
}

const num = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const config = {
    env,
    isProd,
    isTest,

    port: num(process.env.PORT, 3000),

    // Signs the session cookie. The fallback is fine for local dev only.
    sessionSecret:
        requireInProd('SESSION_SECRET', process.env.SESSION_SECRET) || 'dev-secret-change-me',

    // SQLite file. Tests set this to ':memory:'.
    dbFile: process.env.DB_FILE || path.join(__dirname, '..', '..', 'database.db'),

    // Comma-separated browser origins allowed to call the API cross-origin.
    // '*' allows any origin but without cookies (see middleware/cors.js).
    corsOrigins: (process.env.CORS_ORIGINS || '*')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),

    // Per-request logging — on everywhere except the test run by default.
    logRequests: process.env.LOG_REQUESTS
        ? process.env.LOG_REQUESTS === 'true'
        : !isTest,

    // bcrypt cost factor.
    bcryptRounds: num(process.env.BCRYPT_ROUNDS, 12),

    // How long password-reset / email-verification tokens stay valid.
    tokenTtlMinutes: num(process.env.TOKEN_TTL_MINUTES, 60),

    // An opportunity within this many days of its closing date is "closing soon".
    soonThresholdDays: num(process.env.SOON_THRESHOLD_DAYS, 30),
};

module.exports = config;
