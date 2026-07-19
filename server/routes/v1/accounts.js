const express = require("express");
const accountStatementController = require("../../controllers/accountStatement.controller");
const cashBookController = require("../../controllers/cashBook.controller");
const bankBookController = require("../../controllers/bankBook.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { ROLES } = require("../../helpers/roles");

const router = express.Router();

router.use(auth, tenantScope, subscriptionGuard);
router.use(requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.ACCOUNTS, ROLES.TESTER));

router.get("/statements", accountStatementController.getStatements);
router.get("/cash-book", cashBookController.getLedger);
router.get("/bank-book", bankBookController.getLedger);

module.exports = router;
