/**
 * Expense Repository — data access layer for Expenses.
 */

const { Op } = require("sequelize");
const BaseRepository = require("./base.repository");
const Expense = require("../models/Expense");

class ExpenseRepository extends BaseRepository {
  constructor() {
    super(Expense);
  }

  /**
   * Find expenses with optional month/category filter.
   */
  async findAllFiltered({ tenantId, environmentId, month, category, query = {} }) {
    const where = {};

    if (month) where.date = { [Op.like]: `${month}%` };
    if (category && category !== "All") where.category = category;

    return this.findAll({
      tenantId,
      environmentId,
      where,
      order: [["date", "DESC"]],
      query,
    });
  }
}

module.exports = new ExpenseRepository();
