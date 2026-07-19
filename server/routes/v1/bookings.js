/**
 * Booking Routes v1 — uses Controller → Service → Repository pattern.
 * 
 * Mounted at /api/v1/bookings
 * 
 * The original /api/bookings routes remain active for backward compatibility.
 * Frontend can migrate to /api/v1/bookings incrementally.
 */

const express = require("express");
const bookingController = require("../../controllers/booking.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { auditLog } = require("../../middleware/audit");

const router = express.Router();

// GET /api/v1/bookings — list all bookings (with pagination + filters)
router.get("/",
  auth, tenantScope, subscriptionGuard,
  bookingController.list
);

// GET /api/v1/bookings/stats/dashboard — aggregated stats
router.get("/stats/dashboard",
  auth, tenantScope, subscriptionGuard,
  bookingController.dashboardStats
);

// GET /api/v1/bookings/:id — single booking
router.get("/:id",
  auth, tenantScope, subscriptionGuard,
  bookingController.getOne
);

// POST /api/v1/bookings — create new booking
router.post("/",
  auth, tenantScope, subscriptionGuard,
  auditLog("Create Booking"),
  bookingController.create
);

// PUT /api/v1/bookings/:id — update booking
router.put("/:id",
  auth, tenantScope, subscriptionGuard,
  auditLog("Update Booking"),
  bookingController.update
);

// PATCH /api/v1/bookings/:id/status — update status only
router.patch("/:id/status",
  auth, tenantScope, subscriptionGuard,
  auditLog("Update Booking Status"),
  bookingController.updateStatus
);

// DELETE /api/v1/bookings/:id — delete booking
router.delete("/:id",
  auth, requireRole("Owner", "Manager", "Tester"),
  tenantScope, subscriptionGuard,
  auditLog("Delete Booking"),
  bookingController.remove
);

module.exports = router;
