const express = require("express");
const { Op } = require("sequelize");
const Expense = require("../models/Expense");
const { auth, requireRole } = require("../middleware/auth");
const { tenantScope } = require("../middleware/tenantScope");
const { subscriptionGuard } = require("../middleware/subscriptionGuard");
const { auditLog } = require("../middleware/audit");

const router = express.Router();

// GET /api/expenses — list expenses (with optional month/category filter)
router.get("/", auth, tenantScope, subscriptionGuard, async (req, res) => {
  try {
    const { month, category } = req.query;
    const filter = {
      tenantId: req.tenantId,
      environmentId: req.environmentId
    };
    if (month) filter.date = { [Op.like]: `${month}%` };
    if (category && category !== "All") filter.category = category;

    const expenses = await Expense.findAll({ where: filter, order: [["date", "DESC"]] });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// POST /api/expenses — create expense
router.post("/", auth, requireRole("Owner", "Manager", "Tester"), tenantScope, subscriptionGuard, async (req, res) => {
  try {
    const { category, description, amount, date, recurring } = req.body;
    if (!category || !description || !amount || !date) {
      return res.status(400).json({ error: "Category, description, amount, and date required" });
    }
    const expense = await Expense.create({ 
      tenantId: req.tenantId,
      environmentId: req.environmentId,
      category, description, amount: Number(amount), date, recurring: !!recurring 
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: "Failed to create expense" });
  }
});

// PUT /api/expenses/:id — update expense
router.put("/:id", auth, requireRole("Owner", "Manager", "Tester"), tenantScope, subscriptionGuard, async (req, res) => {
  try {
    const expense = await Expense.findOne({ 
      where: { 
        id: req.params.id,
        tenantId: req.tenantId,
        environmentId: req.environmentId
      } 
    });
    if (!expense) return res.status(404).json({ error: "Expense not found" });

    expense.set({ ...req.body, amount: Number(req.body.amount) });
    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: "Failed to update expense" });
  }
});

// DELETE /api/expenses/:id — delete expense
router.delete("/:id", auth, requireRole("Owner", "Manager", "Tester"), tenantScope, subscriptionGuard, auditLog("Delete " + "Expense"), async (req, res) => {
  try {
    const deletedCount = await Expense.destroy({ 
      where: { 
        id: req.params.id,
        tenantId: req.tenantId,
        environmentId: req.environmentId
      } 
    });
    if (deletedCount === 0) return res.status(404).json({ error: "Expense not found" });
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

module.exports = router;
