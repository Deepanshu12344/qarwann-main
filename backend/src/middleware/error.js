function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

function errorHandler(err, req, res, _next) {
  const status = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const payload = {
    message: err.message || 'Internal Server Error',
  };
  if (err.issues) payload.issues = err.issues; // zod
  if (process.env.NODE_ENV !== 'production') payload.stack = err.stack;
  res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };
