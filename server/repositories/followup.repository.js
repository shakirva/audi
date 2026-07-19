const BaseRepository = require("./base.repository");
const { FollowUp, Enquiry } = require("../models");

class FollowUpRepository extends BaseRepository {
  constructor() {
    super(FollowUp);
  }

  async findByEnquiryId(enquiryId, { tenantId, environmentId, query = {} }) {
    return this.findAll({
      tenantId,
      environmentId,
      where: { enquiryId },
      order: [["createdAt", "DESC"]],
      query,
    });
  }

  async findPendingFollowUps({ tenantId, environmentId, salesExecutiveId, query = {} }) {
    // Basic logic to get followups for a specific sales executive
    // Might need JOIN with Enquiry to filter by salesExecutiveId
    const include = [];
    if (salesExecutiveId) {
      include.push({
        model: Enquiry,
        where: { salesExecutiveId },
        attributes: ["enquiryNumber", "customerId"],
      });
    }

    return this.findAll({
      tenantId,
      environmentId,
      include,
      order: [["nextFollowUpDate", "ASC"]],
      query,
    });
  }
}

module.exports = new FollowUpRepository();
