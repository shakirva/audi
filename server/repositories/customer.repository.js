const BaseRepository = require("./base.repository");
const Customer = require("../models/Customer");
const { Op } = require("sequelize");
const sequelize = require("../db");

class CustomerRepository extends BaseRepository {
  constructor() {
    super(Customer);
  }

  async findAllFiltered({ tenantId, environmentId, userRole, userId, search, type, query = {} }) {
    const where = {};
    if (userRole === "Sales") {
      where.createdBy = userId;
    }

    if (type) where.customerType = type;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { page, limit, offset } = require("../helpers/pagination").parsePagination(query);

    const { count, rows } = await this.model.findAndCountAll({
      where: { tenantId, environmentId, ...where },
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COALESCE(SUM("totalAmount"), 0)
              FROM "Bookings" AS "Booking"
              WHERE "Booking"."customerId" = "Customer"."id"
              AND "Booking"."tenantId" = ${tenantId}
              AND "Booking"."environmentId" = ${environmentId}
              AND "Booking"."deletedAt" IS NULL
            )`),
            "lifetimeValue"
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM "Bookings" AS "Booking"
              WHERE "Booking"."customerId" = "Customer"."id"
              AND "Booking"."tenantId" = ${tenantId}
              AND "Booking"."environmentId" = ${environmentId}
              AND "Booking"."deletedAt" IS NULL
            )`),
            "bookingCount"
          ]
        ]
      },
      order: [["createdAt", "DESC"]],
      limit,
      offset
    });

    return { rows, total: count, page, limit };
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
