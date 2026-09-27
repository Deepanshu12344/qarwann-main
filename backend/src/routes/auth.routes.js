const router = require('express').Router();
const { requireAdmin, requireCsrf } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const ctrl = require('../controllers/auth.controller');

router.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many sign-in attempts. Try again later.' }), ctrl.login);
router.get('/me', requireAdmin, ctrl.me);
router.post('/logout', requireAdmin, requireCsrf, ctrl.logout);

module.exports = router;
