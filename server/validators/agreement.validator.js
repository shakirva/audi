const { z } = require("zod");

const createAgreementSchema = z.object({
  body: z.object({
    bookingId: z.number().int().positive("Booking ID is required"),
  }),
});

const updateAgreementSchema = z.object({
  body: z.object({
    status: z.enum(["Draft", "Sent", "Signed", "Cancelled"]).optional(),
    termsAndConditions: z.string().optional(),
    digitalSignatureUrl: z.string().url().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Agreement ID is required"),
  }),
});

module.exports = {
  createAgreementSchema,
  updateAgreementSchema,
};
