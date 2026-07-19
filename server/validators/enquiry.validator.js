const { z } = require("zod");

const ENQUIRY_STATUSES = ["New Enquiry", "Contacted", "Follow-up", "Customer Visit", "Quotation Sent", "Interested", "Booking Confirmed", "Cancelled", "Lost"];

const createEnquirySchema = z.object({
  body: z.object({
    customerId: z.number().int().positive("Customer ID must be a positive integer"),
    eventType: z.string().min(1, "Event type is required"),
    tentativeDate: z.string().optional(),
    session: z.enum(["Morning", "Afternoon", "Evening", "Full Day"]).optional(),
    hallPreference: z.string().optional(),
    guestCount: z.number().int().min(0).optional(),
    budget: z.number().int().min(0).optional(),
    salesExecutiveId: z.number().int().positive().optional(),
    leadScore: z.enum(["Hot", "Warm", "Cold"]).optional(),
    status: z.enum(ENQUIRY_STATUSES).optional(),
    lostReason: z.string().optional(),
    source: z.string().optional(),
    remarks: z.string().optional(),
  }),
});

const updateEnquirySchema = z.object({
  body: z.object({
    eventType: z.string().min(1).optional(),
    tentativeDate: z.string().optional(),
    session: z.enum(["Morning", "Afternoon", "Evening", "Full Day"]).optional(),
    hallPreference: z.string().optional(),
    guestCount: z.number().int().min(0).optional(),
    budget: z.number().int().min(0).optional(),
    salesExecutiveId: z.number().int().positive().optional(),
    leadScore: z.enum(["Hot", "Warm", "Cold"]).optional(),
    status: z.enum(ENQUIRY_STATUSES).optional(),
    lostReason: z.string().optional(),
    source: z.string().optional(),
    remarks: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Enquiry ID is required"),
  }),
});

module.exports = {
  createEnquirySchema,
  updateEnquirySchema,
};
