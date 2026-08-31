// ============================================================
// Tiny request-body validator (no dependency)
// ------------------------------------------------------------
// A schema maps a field name to an array of rule functions. Each
// rule returns null when the value is fine, or a short message
// fragment when it isn't. The first failing rule per field wins.
//
//   validateBody({
//     email:    [rules.required, rules.email],
//     password: [rules.required, rules.string, rules.minLength(8)],
//   })
//
// On failure it forwards ApiError.validation([...]) → 400 with a
// details array of { field, message }.
// ============================================================

const ApiError = require('../lib/ApiError');

const isMissing = (v) => v === undefined || v === null || v === '';

const rules = {
    required: (v) => (isMissing(v) ? 'is required' : null),

    string: (v) => (v !== undefined && typeof v !== 'string' ? 'must be text' : null),

    boolean: (v) => (v !== undefined && typeof v !== 'boolean' ? 'must be true or false' : null),

    email: (v) =>
        !isMissing(v) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))
            ? 'must be a valid email address'
            : null,

    url: (v) => {
        if (isMissing(v)) return null;
        try {
            // eslint-disable-next-line no-new
            new URL(String(v));
            return null;
        } catch {
            return 'must be a valid URL';
        }
    },

    isoDate: (v) =>
        !isMissing(v) && !/^\d{4}-\d{2}-\d{2}$/.test(String(v))
            ? 'must be a date in YYYY-MM-DD format'
            : null,

    minLength: (n) => (v) =>
        v !== undefined && String(v).length < n ? `must be at least ${n} characters` : null,

    maxLength: (n) => (v) =>
        v !== undefined && String(v).length > n ? `must be at most ${n} characters` : null,

    oneOf: (list) => (v) =>
        v !== undefined && !list.includes(v) ? `must be one of: ${list.join(', ')}` : null,
};

/**
 * Build a middleware that validates req.body against `schema`.
 * @param {Record<string, Array<Function>>} schema
 */
function validateBody(schema) {
    return function validator(req, res, next) {
        const body = req.body || {};
        const details = [];

        for (const [field, checks] of Object.entries(schema)) {
            for (const check of checks) {
                const problem = check(body[field]);
                if (problem) {
                    details.push({ field, message: `${field} ${problem}` });
                    break; // one message per field
                }
            }
        }

        if (details.length > 0) {
            return next(ApiError.validation(details));
        }
        return next();
    };
}

/**
 * Derive a "partial" schema from a full one by dropping the
 * `required` rule from every field — useful for PATCH.
 */
function partial(schema) {
    const out = {};
    for (const [field, checks] of Object.entries(schema)) {
        out[field] = checks.filter((c) => c !== rules.required);
    }
    return out;
}

module.exports = { rules, validateBody, partial };
