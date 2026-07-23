const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/auth.controller');

router.post('/login', ctrl.login);
router.get('/me', requireAdmin, ctrl.me);

module.exports = router;
