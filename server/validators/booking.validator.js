/**
 * Booking Validators — Zod schemas for booking-related endpoints.
 *
 * Usage in routes:
 *   const { validate } = require("../../middleware/validate");
 *   const { createBookingSchema } = require("../../validators/booking.validator");
 *   router.post("/", validate(createBookingSchema), controller.create);
 */

const { z } = require("zod");

const createBookingSchema = z.object({
  body: z.object({
    customerName: z.string().min(1, "Customer name is required"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    eventType: z.string().optional(),
    hall: z.string().optional(),
    date: z.string().min(1, "Date is required"),
    session: z.enum(["Morning", "Evening", "Full Day"]).optional().default("Full Day"),
    guests: z.number().int().min(0).optional().default(0),
    advance: z.number().min(0).optional().default(0),
    totalAmount: z.number().min(0).optional().default(0),
    status: z.enum(["Enquiry", "Pending Payment", "Confirmed", "Completed", "Cancelled"]).optional().default("Enquiry"),
    notes: z.string().optional().default(""),
  }),
});

const updateBookingSchema = z.object({
  body: z.object({
    customerName: z.string().min(1).optional(),
    phone: z.string().min(10).optional(),
    eventType: z.string().optional(),
    hall: z.string().optional(),
    date: z.string().optional(),
    session: z.enum(["Morning", "Evening", "Full Day"]).optional(),
    guests: z.number().int().min(0).optional(),
    advance: z.number().min(0).optional(),
    totalAmount: z.number().min(0).optional(),
    status: z.enum(["Enquiry", "Pending Payment", "Confirmed", "Completed", "Cancelled"]).optional(),
    notes: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Booking ID is required"),
  }),
});

const updateBookingStatusSchema = z.object({
  body: z.object({
    status: z.enum(["Enquiry", "Pending Payment", "Confirmed", "Completed", "Cancelled"], {
      required_error: "Status is required",
    }),
  }),
  params: z.object({
    id: z.string().min(1, "Booking ID is required"),
  }),
});

module.exports = {
  createBookingSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
};
