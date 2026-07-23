// Validates req.body / req.query / req.params against zod schemas
function validate({ body, query, params } = {}) {
  return (req, _res, next) => {
    try {
      if (body) req.body = body.parse(req.body);
      if (query) req.query = query.parse(req.query);
      if (params) req.params = params.parse(req.params);
      next();
    } catch (err) {
      err.statusCode = 400;
      err.message = 'Validation failed';
      next(err);
    }
  };
}

module.exports = validate;
