function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

function errorHandler(err, req, res, _next) {
  const status = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const isServerError = status >= 500;
  const payload = { message: isServerError ? 'Internal Server Error' : (err.message || 'Request failed') };
  if (!isServerError && err.issues) payload.issues = err.issues; // zod
  if (process.env.NODE_ENV !== 'production') payload.stack = err.stack;
  res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };
