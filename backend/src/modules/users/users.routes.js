// ============================================================
// /api/v1/users
// ============================================================

const { Router } = require('express');
const ctrl = require('./users.controller');
const requireAuth = require('../../middleware/requireAuth');
const requireRole = require('../../middleware/requireRole');
const { validateBody } = require('../../middleware/validate');
const schema = require('./users.validation');

const router = Router();

// --- self-service: the signed-in user acting on their own account ---
router.get('/me', requireAuth, ctrl.getMe);
router.put('/me', requireAuth, validateBody(schema.updateProfile), ctrl.updateMe);
router.patch('/me', requireAuth, validateBody(schema.updateProfile), ctrl.updateMe);
router.put('/me/password', requireAuth, validateBody(schema.changePassword), ctrl.changeMyPassword);
router.delete('/me', requireAuth, ctrl.deleteMe);

// --- admin only ---
router.get('/', requireRole('admin'), ctrl.listUsers);
router.get('/:id', requireRole('admin'), ctrl.getUser);
router.patch('/:id/role', requireRole('admin'), validateBody(schema.setRole), ctrl.setUserRole);

module.exports = router;
