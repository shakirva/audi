const BaseRepository = require("./base.repository");
const { AccountStatement, Customer } = require("../models");

class AccountStatementRepository extends BaseRepository {
  constructor() {
    super(AccountStatement);
  }

  async getStatement({ tenantId, environmentId, customerId, startDate, endDate }) {
    const where = { tenantId, environmentId, customerId };
    
    // Add date filtering if provided
    if (startDate && endDate) {
      const { Op } = require("sequelize");
      where.date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    return this.model.findAll({
      where,
      order: [["date", "ASC"], ["createdAt", "ASC"]],
    });
  }

  // Gets the most recent balance for a customer
  async getLatestBalance({ tenantId, environmentId, customerId }, transaction) {
    const lastEntry = await this.model.findOne({
      where: { tenantId, environmentId, customerId },
      order: [["createdAt", "DESC"]],
      transaction
    });
    return lastEntry ? lastEntry.balance : 0;
  }
}

module.exports = new AccountStatementRepository();
