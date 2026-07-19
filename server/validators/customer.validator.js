const { z } = require("zod");

const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    altPhone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    customerType: z.enum(["Individual", "Corporate"]).optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
  }),
});

const updateCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    phone: z.string().min(10).optional(),
    altPhone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    customerType: z.enum(["Individual", "Corporate"]).optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Customer ID is required"),
  }),
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
};
