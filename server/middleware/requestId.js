/**
 * Request ID middleware.
 * Attaches a unique request ID to every response for tracing.
 */

const { generateRequestId } = require("../helpers/response");

const requestId = (req, res, next) => {
  const id = generateRequestId();
  res._requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
};

module.exports = { requestId };
