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
const { ROLES } = require("../../helpers/roles");

const router = express.Router();

// GET /api/v1/expenses
router.get("/",
  auth, tenantScope, subscriptionGuard,
  expenseController.list
);

// POST /api/v1/expenses
router.post("/",
  auth, requireRole(ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER, ROLES.ACCOUNTS),
  tenantScope, subscriptionGuard,
  expenseController.create
);

// PUT /api/v1/expenses/:id
router.put("/:id",
  auth, requireRole(ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER, ROLES.ACCOUNTS),
  tenantScope, subscriptionGuard,
  expenseController.update
);

// DELETE /api/v1/expenses/:id
router.delete("/:id",
  auth, requireRole(ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER),
  tenantScope, subscriptionGuard,
  auditLog("Delete Expense"),
  expenseController.remove
);

module.exports = router;
