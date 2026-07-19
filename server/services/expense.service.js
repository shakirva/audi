/**
 * Expense Service — all expense business logic.
 */

const expenseRepository = require("../repositories/expense.repository");
const { NotFoundError, BadRequestError } = require("../helpers/errors");

class ExpenseService {
  /**
   * List expenses with optional filters.
   */
  async listExpenses({ tenantId, environmentId, month, category, query }) {
    const { rows, total, page, limit } = await expenseRepository.findAllFiltered({
      tenantId,
      environmentId,
      month,
      category,
      query,
    });

    return { data: rows, total, page, limit };
  }

  /**
   * Create a new expense.
   */
  async createExpense(data, { tenantId, environmentId }) {
    if (!data.category || !data.description || !data.amount || !data.date) {
      throw new BadRequestError("Category, description, amount, and date required");
    }

    return expenseRepository.create({
      tenantId,
      environmentId,
      category: data.category,
      description: data.description,
      amount: Number(data.amount),
      date: data.date,
      recurring: !!data.recurring,
    });
  }

  /**
   * Update an expense.
   */
  async updateExpense(id, data, { tenantId, environmentId }) {
    const expense = await expenseRepository.findOneOrFail({
      tenantId,
      environmentId,
      where: { id },
      resourceName: "Expense",
    });

    return expenseRepository.update(expense, {
      ...data,
      amount: data.amount !== undefined ? Number(data.amount) : undefined,
    });
  }

  /**
   * Delete an expense.
   */
  async deleteExpense(id, { tenantId, environmentId }) {
    const expense = await expenseRepository.findOneOrFail({
      tenantId,
      environmentId,
      where: { id },
      resourceName: "Expense",
    });

    await expenseRepository.delete(expense);
    return { message: "Expense deleted" };
  }
}

module.exports = new ExpenseService();
