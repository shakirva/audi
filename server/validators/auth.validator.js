const { z } = require("zod");
const { ALL_ROLES } = require("../helpers/roles");

const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
});

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(ALL_ROLES).optional(),
    phone: z.string().optional(),
  }),
});

module.exports = {
  loginSchema,
  registerSchema,
};
