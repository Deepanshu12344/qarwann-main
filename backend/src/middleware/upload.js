const multer = require('multer');

// Memory storage — file is parsed in-process by xlsx, never written to disk.
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const ok = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/octet-stream', // some browsers
  ].includes(file.mimetype) || /\.xlsx$/i.test(file.originalname);
  if (!ok) return cb(new Error('Only .xlsx files are allowed'));
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 20, fieldSize: 10 * 1024 }, // 10 MB file; tightly bounded multipart metadata
});

module.exports = upload;
