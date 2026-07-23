const BaseRepository = require("./base.repository");
const { Enquiry, Customer, User } = require("../models");
const { Op } = require("sequelize");

class EnquiryRepository extends BaseRepository {
  constructor() {
    super(Enquiry);
  }

  async findAllFiltered({ tenantId, environmentId, search, status, salesExecutiveId, query = {} }) {
    const where = {};

    if (status) where.status = status;
    if (salesExecutiveId) where.salesExecutiveId = salesExecutiveId;
    
    if (search) {
      where[Op.or] = [
        { enquiryNumber: { [Op.iLike]: `%${search}%` } },
        { "$Customer.name$": { [Op.iLike]: `%${search}%` } },
        { "$Customer.phone$": { [Op.iLike]: `%${search}%` } },
      ];
    }

    return this.findAll({
      tenantId,
      environmentId,
      where,
      include: [
        { model: Customer, attributes: ["id", "name", "phone", "email", "address", "city"] },
        { model: User, as: "SalesExecutive", attributes: ["id", "name"] }
      ],
      order: [["createdAt", "DESC"]],
      query,
    });
  }

  async findByIdWithDetails(id, { tenantId, environmentId }) {
    return this.model.findOne({
      where: { id, tenantId, environmentId },
      include: [
        { model: Customer, attributes: ["id", "name", "phone", "email", "address", "city", "customerType"] },
        { model: User, as: "SalesExecutive", attributes: ["id", "name"] }
      ]
    });
  }
}

module.exports = new EnquiryRepository();
