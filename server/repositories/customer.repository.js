const BaseRepository = require("./base.repository");
const Customer = require("../models/Customer");
const { Op } = require("sequelize");

class CustomerRepository extends BaseRepository {
  constructor() {
    super(Customer);
  }

  async findAllFiltered({ tenantId, environmentId, search, type, query = {} }) {
    const where = {};

    if (type) where.customerType = type;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    return this.findAll({
      tenantId,
      environmentId,
      where,
      order: [["createdAt", "DESC"]],
      query,
    });
  }

  async findByPhone(phone, { tenantId, environmentId }) {
    return this.findOne({
      tenantId,
      environmentId,
      where: { phone },
    });
  }
}

module.exports = new CustomerRepository();
