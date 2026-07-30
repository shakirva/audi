const { z } = require("zod");

const recordPaymentSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive("Amount must be positive"),
    paymentMode: z.enum(["Cash", "UPI", "Bank Transfer", "Cheque", "Card", "Other"]),
    paymentDate: z.string().min(1, "Payment date is required"),
    bookingId: z.union([z.coerce.number().int().positive(), z.string()]).optional(),
    customerId: z.coerce.number().int().positive().optional(), // Required in service if bookingId doesn't provide one
    referenceNumber: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

module.exports = {
  recordPaymentSchema,
};
