const BaseRepository = require("./base.repository");
const { CashBook } = require("../models");

class CashBookRepository extends BaseRepository {
  constructor() {
    super(CashBook);
  }

  async getLatestBalance({ tenantId, environmentId }, transaction) {
    const lastEntry = await this.model.findOne({
      where: { tenantId, environmentId },
      order: [["createdAt", "DESC"]],
      transaction
    });
    return lastEntry ? lastEntry.balance : 0;
  }
}

module.exports = new CashBookRepository();
