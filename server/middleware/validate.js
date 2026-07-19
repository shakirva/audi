/**
 * Zod validation middleware for Venueza ERP.
 * Validates req.body, req.query, or req.params against a Zod schema.
 *
 * Usage:
 *   const { z } = require("zod");
 *   const { validate } = require("../middleware/validate");
 *
 *   const createBookingSchema = z.object({
 *     body: z.object({
 *       customerName: z.string().min(1),
 *       phone: z.string().min(10),
 *       date: z.string(),
 *     })
 *   });
 *
 *   router.post("/", validate(createBookingSchema), controller.create);
 */

const { ValidationError } = require("../helpers/errors");

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        throw new ValidationError(errors);
      }

      // Replace parsed values (Zod transforms/defaults applied)
      if (result.data.body) req.body = result.data.body;
      if (result.data.query) req.query = result.data.query;
      if (result.data.params) req.params = result.data.params;

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { validate };
