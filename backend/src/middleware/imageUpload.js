const multer = require('multer');

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype) || /\.(jpe?g|png|webp|avif|gif)$/i.test(file.originalname)) {
    return cb(null, true);
  }
  const error = new Error('Only image files (JPEG, PNG, WebP, AVIF, GIF) are allowed');
  error.statusCode = 400;
  cb(error, false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // Max 10 files per request
  },
});

module.exports = {
  uploadSingle: upload.single('image'),
  uploadMultiple: upload.array('images', 10),
};
