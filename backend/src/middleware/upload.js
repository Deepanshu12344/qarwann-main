const multer = require('multer');

// Memory storage — file is parsed in-process by xlsx, never written to disk.
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const ok = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/octet-stream', // some browsers
  ].includes(file.mimetype) || /\.(xlsx|xls)$/i.test(file.originalname);
  if (!ok) return cb(new Error('Only .xlsx or .xls files are allowed'));
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = upload;
