// ============================================================
// Standard API response envelope
// ------------------------------------------------------------
// Success:  { "success": true,  "data": <payload>, "message"?: string, "meta"?: object }
// Error:    { "success": false, "error": { "code": string, "message": string, "details"?: array } }
//
// Every response the API sends goes through one of these two
// helpers, so clients can rely on the shape.
// ============================================================

/**
 * @param {import('express').Response} res
 * @param {*} data                       the payload (an object, array, or null)
 * @param {object} [opts]
 * @param {number} [opts.status=200]
 * @param {string} [opts.message]        optional human-readable note
 * @param {object} [opts.meta]           optional metadata (pagination, counts…)
 */
function sendOk(res, data = null, opts = {}) {
    const { status = 200, message, meta } = opts;
    const body = { success: true, data };
    if (message) body.message = message;
    if (meta) body.meta = meta;
    return res.status(status).json(body);
}

/**
 * @param {import('express').Response} res
 * @param {object} opts
 * @param {number} [opts.status=500]
 * @param {string} [opts.code='INTERNAL_ERROR']
 * @param {string} [opts.message]
 * @param {Array}  [opts.details]
 */
function sendError(res, opts = {}) {
    const {
        status = 500,
        code = 'INTERNAL_ERROR',
        message = 'Something went wrong.',
        details,
    } = opts;
    const error = { code, message };
    if (details) error.details = details;
    return res.status(status).json({ success: false, error });
}

module.exports = { sendOk, sendError };
