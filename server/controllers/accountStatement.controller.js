const accountStatementRepo = require("../repositories/accountStatement.repository");
const { sendSuccess } = require("../helpers/response");

class AccountStatementController {
  async getStatements(req, res, next) {
    try {
      const { customerId, startDate, endDate } = req.query;
      const statements = await accountStatementRepo.getStatement({
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        customerId,
        startDate,
        endDate
      });
      return sendSuccess(res, { data: statements, message: "Account statements fetched successfully" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AccountStatementController();
