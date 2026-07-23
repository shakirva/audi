const customerRepository = require("../repositories/customer.repository");
const bookingRepository = require("../repositories/booking.repository");
const { NotFoundError, BadRequestError } = require("../helpers/errors");

class CustomerService {
  async listCustomers({ tenantId, environmentId, search, type, query }) {
    const { rows, total, page, limit } = await customerRepository.findAllFiltered({
      tenantId,
      environmentId,
      search,
      type,
      query,
    });

    return { data: rows, total, page, limit };
  }

  async findOrCreateCustomer({ name, phone, email, address, place, gender }, { tenantId, environmentId, createdBy }) {
    const existing = await customerRepository.findByPhone(phone, { tenantId, environmentId });
    if (existing) {
      // Update the customer's info with the latest data provided
      const updated = await customerRepository.update(existing, {
        name: name || existing.name,
        address: address || existing.address,
        city: place || existing.city,
        email: email || existing.email,
        updatedBy: createdBy,
      });
      return { customer: updated, created: false };
    }
    const customer = await customerRepository.create({
      tenantId,
      environmentId,
      name,
      phone,
      email: email || null,
      address: address || null,
      city: place || null,
      createdBy,
    });
    return { customer, created: true };
  }

  async getCustomer(id, { tenantId, environmentId }) {
    const customer = await customerRepository.findById(id, { tenantId, environmentId });
    if (!customer) throw new NotFoundError("Customer");

    // Get bookings associated with this customer
    const bookings = await bookingRepository.findAllUnpaginated({
      tenantId,
      environmentId,
      where: { customerId: customer.id },
    });

    return {
      ...customer.toJSON(),
      bookings,
    };
  }

  async createCustomer(data, { tenantId, environmentId, createdBy }) {
    if (!data.name || !data.phone) {
      throw new BadRequestError("Name and phone are required");
    }

    // Check if phone already exists in this tenant/env
    const existing = await customerRepository.findByPhone(data.phone, { tenantId, environmentId });
    if (existing) {
      throw new BadRequestError("Customer with this phone number already exists");
    }

    return customerRepository.create({
      tenantId,
      environmentId,
      ...data,
      createdBy,
    });
  }

  async updateCustomer(id, data, { tenantId, environmentId, updatedBy }) {
    const customer = await customerRepository.findById(id, { tenantId, environmentId });
    if (!customer) throw new NotFoundError("Customer");

    if (data.phone && data.phone !== customer.phone) {
      const existing = await customerRepository.findByPhone(data.phone, { tenantId, environmentId });
      if (existing) {
        throw new BadRequestError("Another customer with this phone number already exists");
      }
    }

    return customerRepository.update(customer, {
      ...data,
      updatedBy,
    });
  }

  async deleteCustomer(id, { tenantId, environmentId }) {
    const customer = await customerRepository.findById(id, { tenantId, environmentId });
    if (!customer) throw new NotFoundError("Customer");

    await customerRepository.delete(customer);
    return { message: "Customer deleted successfully", id };
  }
}

module.exports = new CustomerService();
