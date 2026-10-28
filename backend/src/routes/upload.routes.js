const router = require('express').Router();
const { requireAdmin, requireCsrf } = require('../middleware/auth');
const { uploadSingle, uploadMultiple } = require('../middleware/imageUpload');
const { uploadImage, uploadImages, deleteImage } = require('../controllers/upload.controller');

// Admin only endpoints with CSRF protection
router.post('/image', requireAdmin, requireCsrf, uploadSingle, uploadImage);
router.post('/images', requireAdmin, requireCsrf, uploadMultiple, uploadImages);
router.delete('/', requireAdmin, requireCsrf, deleteImage);
router.delete('/*', requireAdmin, requireCsrf, deleteImage);

module.exports = router;
