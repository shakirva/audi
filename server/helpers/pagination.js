/**
 * Pagination helper — extracts page/limit from query params
 * and returns Sequelize-compatible offset/limit.
 */

function parsePagination(query, defaults = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || defaults.page || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaults.limit || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

module.exports = { parsePagination };
