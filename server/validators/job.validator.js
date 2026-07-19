const { z } = require("zod");

const createJobSchema = z.object({
  body: z.object({
    bookingId: z.number().int().positive("Booking ID is required"),
  }),
});

const updateJobStatusSchema = z.object({
  body: z.object({
    status: z.enum(["Draft", "Confirmed", "Planning", "Ready", "Event Running", "Completed", "Closed"]),
  }),
  params: z.object({
    id: z.string().min(1, "Job ID is required"),
  }),
});

const assignStaffSchema = z.object({
  body: z.object({
    userId: z.number().int().positive("User ID is required"),
    role: z.string().min(1, "Role is required"),
  }),
  params: z.object({
    id: z.string().min(1, "Job ID is required"),
  }),
});

module.exports = {
  createJobSchema,
  updateJobStatusSchema,
  assignStaffSchema,
};
