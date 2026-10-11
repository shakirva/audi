const BaseRepository = require("./base.repository");
const { Enquiry, Customer, User } = require("../models");
const { Op } = require("sequelize");

class EnquiryRepository extends BaseRepository {
  constructor() {
    super(Enquiry);
  }

  async findAllFiltered({ tenantId, environmentId, userRole, userId, search, status, salesExecutiveId, query = {} }) {
    const where = {};

    if (status) where.status = status;
    if (salesExecutiveId) where.salesExecutiveId = salesExecutiveId;
    if (query?.isWaitlisted !== undefined) {
      where.isWaitlisted = query.isWaitlisted === "true" || query.isWaitlisted === true;
    }
    if (query?.waitlistStatus) {
      where.waitlistStatus = query.waitlistStatus;
    }
    
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

  async findWaitlistMatches({ tenantId, environmentId, hall, date }) {
    const where = {
      tenantId,
      environmentId,
      isWaitlisted: true,
      tentativeDate: date,
      waitlistStatus: { [Op.in]: ["Waiting", "Date Released", "Contacted"] },
    };

    if (hall) {
      where.hallPreference = hall;
    }

    return this.model.findAll({
      where,
      include: [
        { model: Customer, attributes: ["id", "name", "phone", "email", "address", "city"] },
        { model: User, as: "SalesExecutive", attributes: ["id", "name"] }
      ],
      order: [
        ["budget", "DESC"],
        ["createdAt", "ASC"]
      ]
    });
  }
}

module.exports = new EnquiryRepository();
