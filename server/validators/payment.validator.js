const { z } = require("zod");

const recordPaymentSchema = z.object({
  body: z.object({
    amount: z.number().int().positive("Amount must be a positive integer"),
    paymentMode: z.enum(["Cash", "UPI", "Bank Transfer", "Cheque", "Card", "Other"]),
    paymentDate: z.string().min(1, "Payment date is required"),
    bookingId: z.number().int().positive().optional(),
    customerId: z.number().int().positive().optional(), // Required in service if bookingId doesn't provide one
    referenceNumber: z.string().optional(),
    notes: z.string().optional(),
  }),
});

module.exports = {
  recordPaymentSchema,
};
