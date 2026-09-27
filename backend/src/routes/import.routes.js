const router = require('express').Router();
const upload = require('../middleware/upload');
const { requireAdmin, requireCsrf } = require('../middleware/auth');
const { importExcel } = require('../controllers/import.controller');

// POST /api/import/excel  (multipart/form-data with field "file") — admin only
router.post('/excel', requireAdmin, requireCsrf, upload.single('file'), importExcel);

module.exports = router;
