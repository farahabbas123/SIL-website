// ============================================================
// /api/v1/contact
// ------------------------------------------------------------
// POST is public (the site's contact form). Listing submissions
// back is admin-only.
// ============================================================

const { Router } = require('express');
const ctrl = require('./contact.controller');
const requireRole = require('../../middleware/requireRole');
const { validateBody } = require('../../middleware/validate');
const schema = require('./contact.validation');

const router = Router();

router.post('/', validateBody(schema.create), ctrl.create);

router.get('/', requireRole('admin'), ctrl.list);
router.get('/:id', requireRole('admin'), ctrl.getOne);

module.exports = router;
