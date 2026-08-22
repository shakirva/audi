/**
 * Delete Pre-Check Routes — returns financial impact data before deletion.
 * Mounted at /api/v1/delete-checks
 */
const express = require("express");
const { auth, requireRole } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { ROLES } = require("../../helpers/roles");
const { Booking, Payment, Receipt, Expense, JournalEntry, Voucher, Agreement, Job, Customer, Enquiry, CashBook, BankBook } = require("../../models");

const router = express.Router();
router.use(auth, tenantScope, subscriptionGuard);

// ── GET /api/v1/delete-checks/booking/:id ──
router.get("/booking/:id", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), async (req, res) => {
  try {
    const { tenantId, environmentId } = req;
    const booking = await Booking.findOne({
      where: { bookingId: req.params.id, tenantId, environmentId },
    });
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const bId = booking.id;
    const payments = await Payment.findAll({ where: { bookingId: bId, tenantId, environmentId } });
    const receipts = await Receipt.findAll({ where: { bookingId: bId, tenantId, environmentId } });
    const expenses = await Expense.findAll({ where: { bookingId: bId, tenantId, environmentId } });
    const journals = await JournalEntry.findAll({ where: { bookingId: bId, tenantId, environmentId } });
    const vouchers = await Voucher.findAll({ where: { bookingId: bId, tenantId, environmentId } });
    const agreement = await Agreement.findOne({ where: { bookingId: bId, tenantId, environmentId } });
    const job = await Job.findOne({ where: { bookingId: bId, tenantId, environmentId } });

    const totalPaid = payments.filter(p => p.status === "Completed").reduce((s, p) => s + p.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const isConfirmed = ["Confirmed", "Completed", "Closed", "Ready For Job"].includes(booking.status);

    res.json({
      success: true,
      data: {
        booking: {
          bookingId: booking.bookingId,
          customerName: booking.customerName,
          eventType: booking.eventType,
          date: booking.date,
          hall: booking.hall,
          session: booking.session,
          status: booking.status,
          totalAmount: booking.totalAmount,
          advance: booking.advance,
        },
        isConfirmed,
        financial: {
          totalPaid,
          totalExpenses,
          balance: booking.totalAmount - totalPaid,
          payments: payments.map(p => ({
            id: p.id, paymentNumber: p.paymentNumber, amount: p.amount,
            paymentMode: p.paymentMode, paymentDate: p.paymentDate, status: p.status,
          })),
          receipts: receipts.map(r => ({
            id: r.id, receiptNumber: r.receiptNumber, amount: r.amount,
          })),
          expenses: expenses.map(e => ({
            id: e.id, category: e.category, description: e.description, amount: e.amount, date: e.date,
          })),
          journalCount: journals.length,
          voucherCount: vouchers.length,
        },
        related: {
          hasAgreement: !!agreement,
          agreementStatus: agreement?.status || null,
          hasJob: !!job,
          jobStatus: job?.status || null,
          hasEnquiry: !!booking.enquiryId,
          enquiryId: booking.enquiryId || null,
          hasCustomer: !!booking.customerId,
          customerId: booking.customerId || null,
          customerName: booking.customerName,
        },
      },
    });
  } catch (err) {
    console.error("Delete check error:", err);
    res.status(500).json({ success: false, message: "Failed to check booking dependencies" });
  }
});

// ── GET /api/v1/delete-checks/customer/:id ──
router.get("/customer/:id", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), async (req, res) => {
  try {
    const { tenantId, environmentId } = req;
    const customer = await Customer.findOne({
      where: { id: req.params.id, tenantId, environmentId },
    });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    const bookings = await Booking.findAll({ where: { customerId: customer.id, tenantId, environmentId } });
    const payments = await Payment.findAll({ where: { customerId: customer.id, tenantId, environmentId } });
    const enquiries = await Enquiry.findAll({ where: { customerId: customer.id, tenantId, environmentId } });

    const activeBookings = bookings.filter(b => !["Cancelled", "Closed"].includes(b.status));
    const totalPaid = payments.filter(p => p.status === "Completed").reduce((s, p) => s + p.amount, 0);
    const totalBookingValue = bookings.reduce((s, b) => s + (b.totalAmount || 0), 0);

    res.json({
      success: true,
      data: {
        customer: { id: customer.id, name: customer.name, phone: customer.phone },
        hasActiveBookings: activeBookings.length > 0,
        activeBookingCount: activeBookings.length,
        totalBookings: bookings.length,
        totalEnquiries: enquiries.length,
        totalPaid,
        totalBookingValue,
        bookings: bookings.map(b => ({
          bookingId: b.bookingId, eventType: b.eventType, date: b.date, status: b.status, totalAmount: b.totalAmount,
        })),
      },
    });
  } catch (err) {
    console.error("Delete check error:", err);
    res.status(500).json({ success: false, message: "Failed to check customer dependencies" });
  }
});

// ── GET /api/v1/delete-checks/enquiry/:id ──
router.get("/enquiry/:id", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), async (req, res) => {
  try {
    const { tenantId, environmentId } = req;
    const enquiry = await Enquiry.findOne({
      where: { id: req.params.id, tenantId, environmentId },
    });
    if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });

    const isConverted = enquiry.status === "Booking Confirmed";
    let linkedBooking = null;
    if (isConverted) {
      const booking = await Booking.findOne({ where: { enquiryId: enquiry.id, tenantId, environmentId } });
      if (booking) {
        linkedBooking = { bookingId: booking.bookingId, status: booking.status, totalAmount: booking.totalAmount, advance: booking.advance };
      }
    }

    res.json({
      success: true,
      data: {
        enquiry: { id: enquiry.id, enquiryNumber: enquiry.enquiryNumber, status: enquiry.status },
        isConverted,
        linkedBooking,
      },
    });
  } catch (err) {
    console.error("Delete check error:", err);
    res.status(500).json({ success: false, message: "Failed to check enquiry dependencies" });
  }
});

module.exports = router;
