const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/admin.controller');

router.get('/stats', requireAdmin, ctrl.stats);

module.exports = router;
