const BaseRepository = require("./base.repository");
const { Agreement, AgreementVersion, AgreementTemplate, Booking, Customer } = require("../models");

class AgreementRepository extends BaseRepository {
  constructor() {
    super(Agreement);
  }

  async findByBookingId(bookingId, { tenantId, environmentId }) {
    return this.findOne({
      tenantId,
      environmentId,
      where: { bookingId },
      include: [
        { model: AgreementVersion, limit: 5, order: [["createdAt", "DESC"]] },
        { model: AgreementTemplate, attributes: ["id", "name"] }
      ]
    });
  }

  async findByIdWithDetails(id, { tenantId, environmentId }) {
    return this.model.findOne({
      where: { id, tenantId, environmentId },
      include: [
        { 
          model: Booking, 
          attributes: ["id", "bookingId", "date", "hall", "eventType", "totalAmount"],
          include: [{ model: Customer, attributes: ["id", "name", "phone", "email"] }]
        },
        { model: AgreementTemplate, attributes: ["id", "name", "content"] },
        { model: AgreementVersion, limit: 10, order: [["versionNumber", "DESC"]] }
      ]
    });
  }
}

module.exports = new AgreementRepository();
