const BaseRepository = require("./base.repository");
const { BankBook } = require("../models");

class BankBookRepository extends BaseRepository {
  constructor() {
    super(BankBook);
  }

  async getLatestBalance({ tenantId, environmentId, masterBankId }, transaction) {
    const where = { tenantId, environmentId };
    if (masterBankId) where.masterBankId = masterBankId;

    const lastEntry = await this.model.findOne({
      where,
      order: [["createdAt", "DESC"]],
      transaction
    });
    return lastEntry ? lastEntry.balance : 0;
  }
}

module.exports = new BankBookRepository();
