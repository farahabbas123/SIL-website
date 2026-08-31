// ============================================================
// asyncHandler — wrap an async route handler so any thrown
// error (or rejected promise) is forwarded to Express's error
// pipeline instead of crashing the process.
//
//   router.get('/x', asyncHandler(async (req, res) => { ... }));
// ============================================================

module.exports = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
