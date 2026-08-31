// ============================================================
// /api/v1/opportunities
// ------------------------------------------------------------
// GET is public (this is the visitor-facing board).
// POST / PUT / PATCH / DELETE require an admin session.
// ============================================================

const { Router } = require('express');
const ctrl = require('./opportunities.controller');
const requireRole = require('../../middleware/requireRole');
const { validateBody } = require('../../middleware/validate');
const schema = require('./opportunities.validation');

const router = Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);

router.post('/', requireRole('admin'), validateBody(schema.create), ctrl.create);
router.put('/:id', requireRole('admin'), validateBody(schema.create), ctrl.update);
router.patch('/:id', requireRole('admin'), validateBody(schema.patch), ctrl.update);
router.delete('/:id', requireRole('admin'), ctrl.remove);

module.exports = router;
