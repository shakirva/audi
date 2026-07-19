const agreementRepository = require("../repositories/agreement.repository");
const bookingRepository = require("../repositories/booking.repository");
const { AgreementTemplate, AgreementVersion } = require("../models");
const { NotFoundError, BadRequestError } = require("../helpers/errors");

class AgreementService {
  async getAll(params, { tenantId, environmentId }) {
    return agreementRepository.findAll({
      tenantId,
      environmentId,
      query: params,
      include: [
        { 
          model: bookingRepository.model, 
          attributes: ["id", "bookingId", "date", "hall", "eventType", "totalAmount", "advance"],
          include: [{ model: bookingRepository.model.associations.Customer.target, attributes: ["id", "name", "phone"] }]
        }
      ],
      order: [["createdAt", "DESC"]]
    });
  }

  async getAgreement(id, { tenantId, environmentId }) {
    const agreement = await agreementRepository.findByIdWithDetails(id, { tenantId, environmentId });
    if (!agreement) throw new NotFoundError("Agreement");
    return agreement;
  }

  async getByBookingId(bookingId, { tenantId, environmentId }) {
    const agreement = await agreementRepository.findByBookingId(bookingId, { tenantId, environmentId });
    if (!agreement) throw new NotFoundError("Agreement for this booking");
    return agreement;
  }

  // Usually called automatically when Booking is confirmed
  async createAgreementForBooking(bookingId, { tenantId, environmentId, createdBy }) {
    const booking = await bookingRepository.findById(bookingId, { tenantId, environmentId });
    if (!booking) throw new NotFoundError("Booking");

    // Check if one already exists
    const existing = await agreementRepository.findByBookingId(bookingId, { tenantId, environmentId });
    if (existing) return existing;

    // Get default template (if any)
    const template = await AgreementTemplate.findOne({
      where: { tenantId, environmentId, isDefault: true }
    });

    const agreement = await agreementRepository.create({
      tenantId,
      environmentId,
      bookingId: booking.id,
      templateId: template ? template.id : null,
      totalAmount: booking.totalAmount,
      advanceAmount: booking.advance,
      balanceAmount: booking.totalAmount - booking.advance,
      status: "Draft",
      createdBy,
    });

    // Create initial version
    await AgreementVersion.create({
      tenantId,
      environmentId,
      agreementId: agreement.id,
      versionNumber: 1,
      contentSnapshot: "Initial Draft", // In reality, this would be generated from template + booking data
      changeSummary: "Agreement created from Booking",
      createdBy,
    });

    return agreement;
  }

  async updateAgreement(id, data, { tenantId, environmentId, updatedBy }) {
    const agreement = await agreementRepository.findById(id, { tenantId, environmentId });
    if (!agreement) throw new NotFoundError("Agreement");

    // If terms or content changes, create a new version
    if (data.termsAndConditions && data.termsAndConditions !== agreement.termsAndConditions) {
      const lastVersion = await AgreementVersion.findOne({
        where: { agreementId: agreement.id },
        order: [["versionNumber", "DESC"]]
      });
      const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

      await AgreementVersion.create({
        tenantId,
        environmentId,
        agreementId: agreement.id,
        versionNumber: nextVersionNumber,
        contentSnapshot: data.termsAndConditions,
        changeSummary: "Terms updated",
        createdBy: updatedBy,
      });
    }

    return agreementRepository.update(agreement, {
      ...data,
      updatedBy,
    });
  }

  async generatePdf(id, { tenantId, environmentId }) {
    const agreement = await agreementRepository.findByIdWithDetails(id, { tenantId, environmentId });
    if (!agreement) throw new NotFoundError("Agreement");
    
    // Stub for PDF generation
    // 1. Compile template with Booking & Customer data
    // 2. Generate PDF using Puppeteer or similar
    // 3. Upload to S3/Cloud Storage
    // 4. Update agreement with PDF URL
    
    const fakePdfUrl = `https://storage.venueza.com/agreements/${agreement.agreementNumber}.pdf`;
    await agreementRepository.update(agreement, { status: "Sent" });

    return { message: "PDF generated successfully", url: fakePdfUrl };
  }
}

module.exports = new AgreementService();
