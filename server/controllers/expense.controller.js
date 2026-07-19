/**
 * Expense Controller — thin HTTP handler for expense routes.
 */

const expenseService = require("../services/expense.service");
const { sendSuccess, buildPagination } = require("../helpers/response");

class ExpenseController {
  /**
   * GET /api/v1/expenses
   */
  async list(req, res, next) {
    try {
      const { month, category } = req.query;
      const result = await expenseService.listExpenses({
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        month,
        category,
        query: req.query,
      });

      return sendSuccess(res, {
        data: result.data,
        message: "Expenses fetched successfully",
        pagination: buildPagination(result.total, result.page, result.limit),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/expenses
   */
  async create(req, res, next) {
    try {
      const expense = await expenseService.createExpense(req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });

      return sendSuccess(res, {
        data: expense,
        message: "Expense created successfully",
        statusCode: 201,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/expenses/:id
   */
  async update(req, res, next) {
    try {
      const expense = await expenseService.updateExpense(req.params.id, req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });

      return sendSuccess(res, {
        data: expense,
        message: "Expense updated successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/expenses/:id
   */
  async remove(req, res, next) {
    try {
      const result = await expenseService.deleteExpense(req.params.id, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });

      return sendSuccess(res, {
        data: result,
        message: "Expense deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ExpenseController();
