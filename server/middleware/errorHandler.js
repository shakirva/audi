/**
 * Centralized error handler for Venueza ERP.
 *
 * Catches all errors thrown via next(err) or thrown in async handlers.
 * Converts AppError instances into standardized API responses.
 * Logs unexpected errors for debugging.
 */

const { AppError } = require("../helpers/errors");
const { sendError } = require("../helpers/response");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Sequelize validation errors
  if (err.name === "SequelizeValidationError") {
    const errors = err.errors?.map((e) => ({
      field: e.path,
      message: e.message,
    })) || [];

    return sendError(res, {
      message: "Validation failed",
      statusCode: 422,
      errors,
    });
  }

  // Sequelize unique constraint errors (duplicate records)
  if (err.name === "SequelizeUniqueConstraintError") {
    const fields = err.errors?.map((e) => e.path).filter(Boolean).join(", ") || "record";
    return sendError(res, {
      message: `A duplicate ${fields} already exists. Please try again.`,
      statusCode: 409,
    });
  }

  // Our custom AppError hierarchy
  if (err instanceof AppError) {
    return sendError(res, {
      message: err.message,
      statusCode: err.statusCode,
      errors: err.errors,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return sendError(res, {
      message: "Invalid or expired token",
      statusCode: 401,
    });
  }

  if (err.name === "TokenExpiredError") {
    return sendError(res, {
      message: "Token expired",
      statusCode: 401,
    });
  }

  // Unexpected errors — log full stack
  console.error("Unhandled error:", err);

  return sendError(res, {
    message: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error",
    statusCode: 500,
  });
};

module.exports = { errorHandler };
