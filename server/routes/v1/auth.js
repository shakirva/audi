const express = require("express");
const authController = require("../../controllers/auth.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { validate } = require("../../middleware/validate");
const { loginSchema, registerSchema } = require("../../validators/auth.validator");
const { ROLES } = require("../../helpers/roles");

const router = express.Router();

router.post("/login", validate(loginSchema), authController.login);
router.get("/me", auth, authController.me);
router.post("/register", auth, requireRole(ROLES.OWNER), validate(registerSchema), authController.register);
router.post("/bootstrap", authController.bootstrap);

module.exports = router;
