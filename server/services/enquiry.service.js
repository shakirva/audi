const enquiryRepository = require("../repositories/enquiry.repository");
const customerRepository = require("../repositories/customer.repository");
const availabilityService = require("./availability.service");
const { NotFoundError, BadRequestError, ConflictError } = require("../helpers/errors");

class EnquiryService {
  async listEnquiries({ tenantId, environmentId, userRole, userId, search, status, salesExecutiveId, query }) {
    const result = await enquiryRepository.findAllFiltered({
      tenantId,
      environmentId,
      userRole,
      userId,
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
    if (data.customerId) {
      const customer = await customerRepository.findById(data.customerId, { tenantId, environmentId });
      if (!customer) throw new NotFoundError("Customer not found");
    }

    if (data.hallPreference && data.tentativeDate && data.session) {
      const avail = await availabilityService.checkAvailability({
        tenantId,
        environmentId,
        hall: data.hallPreference,
        date: data.tentativeDate,
        session: data.session
      });
      if (!avail.available) {
        throw new ConflictError(`This session has just been booked by another user. Please choose another session. (${avail.reason})`);
      }
    }

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

    if (data.hallPreference && data.tentativeDate && data.session) {
      const avail = await availabilityService.checkAvailability({
        tenantId,
        environmentId,
        hall: data.hallPreference,
        date: data.tentativeDate,
        session: data.session,
        // Enquiries shouldn't block other enquiries, but if there's a booking, we throw. 
        // We pass ignoreBookingId: null because enquiries aren't bookings anyway.
      });
      if (!avail.available) {
        throw new ConflictError(`This session has just been booked by another user. Please choose another session. (${avail.reason})`);
      }
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
