const BaseRepository = require("./base.repository");
const { Payment, Receipt, Customer, Booking, User } = require("../models");

class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }

  async findAllWithDetails({ tenantId, environmentId, bookingId, customerId, query = {} }) {
    const where = {};
    if (bookingId) where.bookingId = bookingId;
    if (customerId) where.customerId = customerId;

    return this.findAll({
      tenantId,
      environmentId,
      where,
      include: [
        { model: Customer, attributes: ["id", "name", "phone"] },
        { model: Booking, attributes: ["id", "bookingId", "hall", "date"] },
        { model: Receipt, attributes: ["id", "receiptNumber", "pdfUrl", "status"] },
        { model: User, as: "creator", attributes: ["id", "name"] }
      ],
      order: [["paymentDate", "DESC"], ["createdAt", "DESC"]],
      query,
    });
  }

  async findByIdWithDetails(id, { tenantId, environmentId }) {
    return this.model.findOne({
      where: { id, tenantId, environmentId },
      include: [
        { model: Customer, attributes: ["id", "name", "phone", "email"] },
        { model: Booking, attributes: ["id", "bookingId", "totalAmount", "advance"] },
        { model: Receipt }
      ]
    });
  }
}

module.exports = new PaymentRepository();
