const bankBookRepo = require("../repositories/bankBook.repository");
const { sendSuccess } = require("../helpers/response");

class BankBookController {
  async getLedger(req, res, next) {
    try {
      const ledger = await bankBookRepo.findAll({
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        order: [["date", "ASC"], ["createdAt", "ASC"]]
      });
      return sendSuccess(res, { data: ledger, message: "Bank book ledger fetched successfully" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BankBookController();
