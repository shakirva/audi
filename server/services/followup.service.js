const followupRepository = require("../repositories/followup.repository");
const enquiryRepository = require("../repositories/enquiry.repository");
const { NotFoundError } = require("../helpers/errors");

class FollowUpService {
  async listFollowUps({ tenantId, environmentId, enquiryId, query }) {
    const result = await followupRepository.findByEnquiryId(enquiryId, {
      tenantId,
      environmentId,
      query,
    });
    return { data: result.rows, total: result.total, page: result.page, limit: result.limit };
  }

  async getFollowUp(id, { tenantId, environmentId }) {
    const followup = await followupRepository.findById(id, { tenantId, environmentId });
    if (!followup) throw new NotFoundError("FollowUp");
    return followup;
  }

  async createFollowUp(data, { tenantId, environmentId, createdBy }) {
    // Verify enquiry exists
    const enquiry = await enquiryRepository.findById(data.enquiryId, { tenantId, environmentId });
    if (!enquiry) throw new NotFoundError("Enquiry not found");

    // Create followup
    const followup = await followupRepository.create({
      tenantId,
      environmentId,
      ...data,
      createdBy,
    });

    // Optionally update enquiry status based on followup
    if (data.outcome === "Interested" && enquiry.status === "New") {
      await enquiryRepository.update(enquiry, { status: "Contacted", updatedBy: createdBy });
    }

    return followup;
  }

  async updateFollowUp(id, data, { tenantId, environmentId, updatedBy }) {
    const followup = await followupRepository.findById(id, { tenantId, environmentId });
    if (!followup) throw new NotFoundError("FollowUp");

    return followupRepository.update(followup, {
      ...data,
      updatedBy,
    });
  }

  async deleteFollowUp(id, { tenantId, environmentId }) {
    const followup = await followupRepository.findById(id, { tenantId, environmentId });
    if (!followup) throw new NotFoundError("FollowUp");

    await followupRepository.delete(followup);
    return { message: "FollowUp deleted successfully", id };
  }
}

module.exports = new FollowUpService();
