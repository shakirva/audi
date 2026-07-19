const { z } = require("zod");

const createFollowUpSchema = z.object({
  body: z.object({
    enquiryId: z.number().int().positive("Enquiry ID is required"),
    type: z.enum(["Call", "Visit", "WhatsApp", "Email", "Meeting"]),
    notes: z.string().min(1, "Notes are required"),
    nextFollowUpDate: z.string().optional(),
    outcome: z.enum(["Interested", "Not Interested", "Callback", "Converted", "No Answer"]).optional(),
  }),
});

const updateFollowUpSchema = z.object({
  body: z.object({
    type: z.enum(["Call", "Visit", "WhatsApp", "Email", "Meeting"]).optional(),
    notes: z.string().min(1).optional(),
    nextFollowUpDate: z.string().optional(),
    outcome: z.enum(["Interested", "Not Interested", "Callback", "Converted", "No Answer"]).optional(),
  }),
  params: z.object({
    id: z.string().min(1, "FollowUp ID is required"),
  }),
});

module.exports = {
  createFollowUpSchema,
  updateFollowUpSchema,
};
