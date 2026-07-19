/**
 * Standardized API response helpers for Venueza ERP.
 *
 * Every API response follows a consistent format:
 * {
 *   success: boolean,
 *   message: string,
 *   data: any,
 *   pagination?: object,
 *   errors?: array,
 *   timestamp: string,
 *   requestId: string
 * }
 */

const crypto = require("crypto");

function generateRequestId() {
  return "req_" + crypto.randomBytes(8).toString("hex");
}

/**
 * Send a success response.
 */
function sendSuccess(res, { data = null, message = "Success", statusCode = 200, pagination = null } = {}) {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    requestId: res._requestId || generateRequestId(),
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send an error response.
 */
function sendError(res, { message = "Internal server error", statusCode = 500, errors = null } = {}) {
  const response = {
    success: false,
    message,
    data: null,
    errors,
    timestamp: new Date().toISOString(),
    requestId: res._requestId || generateRequestId(),
  };

  return res.status(statusCode).json(response);
}

/**
 * Build pagination metadata from Sequelize results.
 * @param {number} total - Total record count
 * @param {number} page - Current page (1-indexed)
 * @param {number} limit - Records per page
 */
function buildPagination(total, page, limit) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

module.exports = { sendSuccess, sendError, buildPagination, generateRequestId };
