/**
 * Expense Validators — Zod schemas for expense endpoints.
 */

const { z } = require("zod");

const createExpenseSchema = z.object({
  body: z.object({
    category: z.string().min(1, "Category is required"),
    description: z.string().min(1, "Description is required"),
    amount: z.number().positive("Amount must be positive"),
    date: z.string().min(1, "Date is required"),
    recurring: z.boolean().optional().default(false),
  }),
});

const updateExpenseSchema = z.object({
  body: z.object({
    category: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    date: z.string().optional(),
    recurring: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Expense ID is required"),
  }),
});

module.exports = {
  createExpenseSchema,
  updateExpenseSchema,
};
