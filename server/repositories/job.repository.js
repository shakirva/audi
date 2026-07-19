const BaseRepository = require("./base.repository");
const { Job, JobStaff, JobVendor, JobTimeline, JobChecklist, JobDocument, Customer, Booking, Agreement, User } = require("../models");

class JobRepository extends BaseRepository {
  constructor() {
    super(Job);
  }

  async findAllWithDetails({ tenantId, environmentId, status, priority, query = {} }) {
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    return this.findAll({
      tenantId,
      environmentId,
      where,
      include: [
        { model: Customer, attributes: ["id", "name", "phone"] },
        { model: Booking, attributes: ["id", "bookingId", "totalAmount"] },
      ],
      order: [["eventDate", "ASC"], ["createdAt", "DESC"]],
      query,
    });
  }

  async findByIdWithDetails(id, { tenantId, environmentId }) {
    return this.model.findOne({
      where: { id, tenantId, environmentId },
      include: [
        { model: Customer, attributes: ["id", "name", "phone", "email"] },
        { model: Booking, attributes: ["id", "bookingId", "totalAmount", "advance", "guests", "session"] },
        { model: Agreement, attributes: ["id", "agreementNumber", "status"] },
        { 
          model: JobStaff, 
          include: [{ model: User, attributes: ["id", "name", "email"] }]
        },
        { model: JobVendor },
        { 
          model: JobChecklist,
          include: [{ model: User, as: "CompletedByUser", attributes: ["id", "name"] }]
        },
        { 
          model: JobDocument,
          include: [{ model: User, as: "UploadedByUser", attributes: ["id", "name"] }]
        },
        { 
          model: JobTimeline,
          include: [{ model: User, attributes: ["id", "name"] }],
          order: [["createdAt", "DESC"]]
        }
      ]
    });
  }
}

module.exports = new JobRepository();
