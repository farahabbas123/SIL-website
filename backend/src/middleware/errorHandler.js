// ============================================================
// 404 + centralised error handling
// ------------------------------------------------------------
// notFoundHandler: mounted after all routes — anything that fell
//   through becomes a standard NOT_FOUND envelope.
// errorHandler:    the last middleware — turns thrown errors into
//   the standard error envelope. ApiError instances carry their
//   own status/code; everything else is a 500 (and gets logged).
// ============================================================

const ApiError = require('../lib/ApiError');
const { sendError } = require('../lib/response');
const config = require('../config');

function notFoundHandler(req, res) {
    return sendError(res, {
        status: 404,
        code: 'NOT_FOUND',
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    if (res.headersSent) return next(err);

    if (err instanceof ApiError) {
        return sendError(res, {
            status: err.status,
            code: err.code,
            message: err.message,
            details: err.details,
        });
    }

    // express.json() / body-parser rejected the payload
    if (err && (err.type === 'entity.parse.failed' || err.type === 'entity.too.large')) {
        return sendError(res, {
            status: 400,
            code: 'BAD_REQUEST',
            message: 'Request body could not be parsed as JSON.',
        });
    }

    // A DB constraint that a service didn't translate itself
    if (err && typeof err.code === 'string' && err.code.startsWith('SQLITE_CONSTRAINT')) {
        return sendError(res, {
            status: 409,
            code: 'CONFLICT',
            message: 'That change conflicts with existing data.',
        });
    }

    if (!config.isTest) {
        // eslint-disable-next-line no-console
        console.error('[error]', err);
    }
    return sendError(res, {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong.',
    });
}

module.exports = { notFoundHandler, errorHandler };
