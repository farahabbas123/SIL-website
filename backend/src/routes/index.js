// ============================================================
// API v1 router — mounts every module and the health checks.
// Assembled into the app at both /api/v1 (canonical) and /api.
// ============================================================

const { Router } = require('express');
const config = require('../config');
const { sendOk } = require('../lib/response');

const authRoutes = require('../modules/auth/auth.routes');
const usersRoutes = require('../modules/users/users.routes');
const opportunitiesRoutes = require('../modules/opportunities/opportunities.routes');

const router = Router();

// ---- health ----
router.get('/health', (req, res) => {
    sendOk(res, {
        status: 'ok',
        env: config.env,
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});

// Legacy health check kept for older callers / tests.
router.get('/test', (req, res) => {
    sendOk(res, { message: 'Backend is working!' });
});

// ---- modules ----
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/opportunities', opportunitiesRoutes);

module.exports = router;
