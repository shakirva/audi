const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { Booking, Enquiry, Payment, Expense, Customer } = require("../../models");
const { auth } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { planGate } = require("../../middleware/planGate");

router.use(auth, tenantScope, subscriptionGuard, planGate);

// Used purely to trigger the planGate middleware for the entire /reports module
router.get("/access", (req, res) => {
  res.json({ success: true });
});

// GET /api/v1/reports/monthly-summary
router.get("/monthly-summary", async (req, res) => {
  try {
    const { month, year, start, end } = req.query;
    const tenantId = req.tenantId; // from tenantScope middleware
    
    let startDate, endDate;
    if (start && end) {
      startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const m = parseInt(month) || (new Date().getMonth() + 1);
      const y = parseInt(year) || new Date().getFullYear();
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 0, 23, 59, 59, 999);
    }
    
    const dateQuery = {
      tenantId,
      createdAt: { [Op.between]: [startDate, endDate] }
    };

    const bookingDateQuery = {
      tenantId,
      date: { [Op.between]: [startDate, endDate] } // Assuming 'date' is the event date
    };

    // 1. Financials
    const payments = await Payment.findAll({ where: dateQuery, raw: true });
    const expenses = await Expense.findAll({ where: dateQuery, raw: true });
    
    const totalRevenue = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const netBalance = totalRevenue - totalExpenses;

    const upiCollected = payments
      .filter(p => p.method && p.method.toLowerCase() === 'upi')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      
    const bankCollected = payments
      .filter(p => p.method && p.method.toLowerCase().includes('bank'))
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    // 2. Operational KPIs
    const bookings = await Booking.findAll({ where: bookingDateQuery, raw: true });
    
    const totalBookings = bookings.filter(b => b.status !== 'Cancelled').length;
    const cancelledBookings = bookings.filter(b => b.status === 'Cancelled').length;
    
    const totalEnquiries = await Enquiry.count({ where: dateQuery });
    const newCustomers = await Customer.count({ where: dateQuery });

    // 3. Analytical Breakdowns
    const hallMap = {};
    bookings.filter(b => b.status !== 'Cancelled').forEach(b => {
      const hall = b.hallName || b.hallId || 'Main Hall'; 
      hallMap[hall] = (hallMap[hall] || 0) + 1;
    });
    const hallData = Object.keys(hallMap).map(name => ({ name, value: hallMap[name] }));

    const eventTypeMap = {};
    bookings.filter(b => b.status !== 'Cancelled').forEach(b => {
      const type = b.eventType || 'Other';
      eventTypeMap[type] = (eventTypeMap[type] || 0) + 1;
    });
    const eventTypeData = Object.keys(eventTypeMap).map(name => ({ name, value: eventTypeMap[name] }));

    return res.json({
      success: true,
      data: {
        financials: { totalRevenue, totalExpenses, netBalance },
        collections: { upi: upiCollected, bank: bankCollected },
        operations: { totalBookings, cancelledBookings, totalEnquiries, newCustomers },
        analytics: { halls: hallData, eventTypes: eventTypeData },
        details: {
          recentBookings: bookings.filter(b => b.status !== 'Cancelled').slice(0, 15).map(b => {
            const total = parseFloat(b.totalAmount) || 0;
            const advance = parseFloat(b.advance) || 0;
            return {
              id: b.id,
              bookingId: b.bookingId,
              date: b.date,
              customerName: b.customerName,
              hall: b.hallName || b.hall || 'Main Hall',
              status: b.status,
              totalAmount: total,
              advance: advance,
              balanceAmount: total - advance
            };
          }),
          recentExpenses: expenses.slice(0, 15).map(e => ({
            id: e.id,
            date: e.date,
            category: e.category,
            description: e.description,
            amount: e.amount
          })),
          recentPayments: payments.slice(0, 15).map(p => ({
            id: p.id,
            paymentNumber: p.paymentNumber,
            paymentDate: p.paymentDate,
            method: p.method,
            amount: p.amount
          }))
        }
      }
    });

  } catch (error) {
    console.error("Monthly Summary Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate monthly summary" });
  }
});

module.exports = router;
