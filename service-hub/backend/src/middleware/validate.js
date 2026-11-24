const ApiError = require('../utils/ApiError');

// validate(schema) for body, validate(schema, 'query') for query strings, validate(schema, 'params') for URL params
module.exports = (schema, source = 'body') => (req, res, next) => {
  const { value, error } = schema.validate(req[source], { abortEarly: false, stripUnknown: true, convert: true });
  if (error) {
    const details = error.details.map((d) => ({ field: d.path.join('.'), message: d.message.replace(/"/g, '') }));
    return next(ApiError.badRequest('Please check the highlighted fields', details));
  }
  if (source === 'query') {
    req.validatedQuery = value;
  } else {
    req[source] = value;
  }
  return next();
};
