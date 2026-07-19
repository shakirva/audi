const cashBookRepo = require("../repositories/cashBook.repository");
const { sendSuccess } = require("../helpers/response");

class CashBookController {
  async getLedger(req, res, next) {
    try {
      const ledger = await cashBookRepo.findAll({
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        order: [["date", "ASC"], ["createdAt", "ASC"]]
      });
      return sendSuccess(res, { data: ledger, message: "Cash book ledger fetched successfully" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CashBookController();
