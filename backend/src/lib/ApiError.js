// ============================================================
// ApiError — the one error type the app throws on purpose
// ------------------------------------------------------------
// Services and controllers throw these; the central error
// handler (middleware/errorHandler.js) turns them into the
// standard JSON error envelope. Anything that ISN'T an
// ApiError is treated as an unexpected 500.
// ============================================================

class ApiError extends Error {
    /**
     * @param {number} status  HTTP status code
     * @param {string} code    stable machine-readable code, e.g. 'NOT_FOUND'
     * @param {string} message human-readable message (safe to show the client)
     * @param {Array<{field:string,message:string}>} [details] field-level errors
     */
    constructor(status, code, message, details) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.details = details;
    }

    static badRequest(message = 'Bad request.', details) {
        return new ApiError(400, 'BAD_REQUEST', message, details);
    }

    static validation(details, message = 'Validation failed.') {
        return new ApiError(400, 'VALIDATION_ERROR', message, details);
    }

    static unauthorized(message = 'You must be signed in to do that.') {
        return new ApiError(401, 'UNAUTHORIZED', message);
    }

    static forbidden(message = 'You do not have permission to do that.') {
        return new ApiError(403, 'FORBIDDEN', message);
    }

    static notFound(message = 'Not found.') {
        return new ApiError(404, 'NOT_FOUND', message);
    }

    static conflict(message = 'That conflicts with existing data.') {
        return new ApiError(409, 'CONFLICT', message);
    }
}

module.exports = ApiError;
