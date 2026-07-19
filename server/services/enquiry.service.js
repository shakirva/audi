const enquiryRepository = require("../repositories/enquiry.repository");
const customerRepository = require("../repositories/customer.repository");
const { NotFoundError, BadRequestError } = require("../helpers/errors");

class EnquiryService {
  async listEnquiries({ tenantId, environmentId, search, status, salesExecutiveId, query }) {
    const result = await enquiryRepository.findAllFiltered({
      tenantId,
      environmentId,
      search,
      status,
      salesExecutiveId,
      query,
    });
    return { data: result.rows, total: result.total, page: result.page, limit: result.limit };
  }

  async getEnquiry(id, { tenantId, environmentId }) {
    const enquiry = await enquiryRepository.findByIdWithDetails(id, { tenantId, environmentId });
    if (!enquiry) throw new NotFoundError("Enquiry");
    return enquiry;
  }

  async createEnquiry(data, { tenantId, environmentId, createdBy }) {
    // Verify customer exists
    const customer = await customerRepository.findById(data.customerId, { tenantId, environmentId });
    if (!customer) throw new NotFoundError("Customer not found");

    return enquiryRepository.create({
      tenantId,
      environmentId,
      ...data,
      createdBy,
    });
  }

  async updateEnquiry(id, data, { tenantId, environmentId, updatedBy }) {
    const enquiry = await enquiryRepository.findById(id, { tenantId, environmentId });
    if (!enquiry) throw new NotFoundError("Enquiry");

    if (data.status === "Lost" && !data.lostReason) {
      throw new BadRequestError("Lost reason is required when status is Lost");
    }

    return enquiryRepository.update(enquiry, {
      ...data,
      updatedBy,
    });
  }

  async deleteEnquiry(id, { tenantId, environmentId }) {
    const enquiry = await enquiryRepository.findById(id, { tenantId, environmentId });
    if (!enquiry) throw new NotFoundError("Enquiry");

    await enquiryRepository.delete(enquiry);
    return { message: "Enquiry deleted successfully", id };
  }
}

module.exports = new EnquiryService();
