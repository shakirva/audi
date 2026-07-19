/**
 * Expense Routes v1 — uses Controller → Service → Repository pattern.
 * 
 * Mounted at /api/v1/expenses
 */

const express = require("express");
const expenseController = require("../../controllers/expense.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { auditLog } = require("../../middleware/audit");

const router = express.Router();

// GET /api/v1/expenses
router.get("/",
  auth, tenantScope, subscriptionGuard,
  expenseController.list
);

// POST /api/v1/expenses
router.post("/",
  auth, requireRole("Owner", "Manager", "Tester"),
  tenantScope, subscriptionGuard,
  expenseController.create
);

// PUT /api/v1/expenses/:id
router.put("/:id",
  auth, requireRole("Owner", "Manager", "Tester"),
  tenantScope, subscriptionGuard,
  expenseController.update
);

// DELETE /api/v1/expenses/:id
router.delete("/:id",
  auth, requireRole("Owner", "Manager", "Tester"),
  tenantScope, subscriptionGuard,
  auditLog("Delete Expense"),
  expenseController.remove
);

module.exports = router;
