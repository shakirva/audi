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
    // Extended fields
    taxes: z.number().optional(),
    taxPercentage: z.number().optional(),
    discount: z.number().optional(),
    package: z.string().optional(),
    brideName: z.string().optional(),
    groomName: z.string().optional(),
    fatherName: z.string().optional(),
    motherName: z.string().optional(),
    email: z.string().optional(),
    whatsapp: z.string().optional(),
    decoration: z.string().optional(),
    catering: z.string().optional(),
    sound: z.string().optional(),
    specialInstructions: z.string().optional(),
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
    // Extended fields
    taxes: z.number().optional(),
    taxPercentage: z.number().optional(),
    discount: z.number().optional(),
    package: z.string().optional(),
    brideName: z.string().optional(),
    groomName: z.string().optional(),
    fatherName: z.string().optional(),
    motherName: z.string().optional(),
    email: z.string().optional(),
    whatsapp: z.string().optional(),
    decoration: z.string().optional(),
    catering: z.string().optional(),
    sound: z.string().optional(),
    specialInstructions: z.string().optional(),
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
