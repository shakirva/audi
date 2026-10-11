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
    const { month, year, start, end, allTime } = req.query;
    const tenantId = req.tenantId; // from tenantScope middleware
    
    const isAllTime = allTime === "true" || allTime === true;
    let startDate, endDate, startStr, endStr;
    
    if (!isAllTime) {
      if (start && end) {
        startStr = String(start).slice(0, 10);
        endStr = String(end).slice(0, 10);
        startDate = new Date(`${startStr}T00:00:00.000Z`);
        endDate = new Date(`${endStr}T23:59:59.999Z`);
      } else {
        const m = parseInt(month) || (new Date().getMonth() + 1);
        const y = parseInt(year) || new Date().getFullYear();
        const mStr = String(m).padStart(2, "0");
        const lastDay = new Date(y, m, 0).getDate();
        startStr = `${y}-${mStr}-01`;
        endStr = `${y}-${mStr}-${String(lastDay).padStart(2, "0")}`;
        startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
        endDate = new Date(Date.UTC(y, m - 1, lastDay, 23, 59, 59, 999));
      }
    }
    
    const generalDateQuery = {
      tenantId,
      ...(isAllTime ? {} : {
        createdAt: { [Op.between]: [startDate, endDate] }
      })
    };

    const bookingDateQuery = {
      tenantId,
      ...(isAllTime ? {} : {
        [Op.or]: [
          { date: { [Op.between]: [startStr, endStr] } },
          { deletedAt: { [Op.between]: [startDate, endDate] } }
        ]
      })
    };

    const paymentDateQuery = {
      tenantId,
      ...(isAllTime ? {} : {
        [Op.or]: [
          { paymentDate: { [Op.between]: [startStr, endStr] } },
          { createdAt: { [Op.between]: [startDate, endDate] } }
        ]
      })
    };

    const expenseDateQuery = {
      tenantId,
      ...(isAllTime ? {} : {
        [Op.or]: [
          { date: { [Op.between]: [startStr, endStr] } },
          { createdAt: { [Op.between]: [startDate, endDate] } }
        ]
      })
    };

    // 1. Financials
    const payments = await Payment.findAll({ where: paymentDateQuery, raw: true });
    const expenses = await Expense.findAll({ where: expenseDateQuery, raw: true });
    
    const totalRevenue = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const netBalance = totalRevenue - totalExpenses;

    const upiCollected = payments
      .filter(p => {
        const m = (p.paymentMode || p.method || "").toLowerCase();
        return m === "upi";
      })
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      
    const bankCollected = payments
      .filter(p => {
        const m = (p.paymentMode || p.method || "").toLowerCase();
        return m.includes("bank") || m.includes("transfer") || m.includes("card") || m.includes("cheque");
      })
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const cashCollected = payments
      .filter(p => {
        const m = (p.paymentMode || p.method || "").toLowerCase();
        return m === "cash";
      })
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    // 2. Operational KPIs — include paranoid:false to capture soft-deleted bookings as cancellations
    const bookings = await Booking.findAll({ where: bookingDateQuery, paranoid: false, raw: true });
    
    const activeBookings = bookings.filter(b => !b.deletedAt && b.status !== "Cancelled");
    const cancelledBookingsList = bookings.filter(b => !!b.deletedAt || b.status === "Cancelled");
    const totalBookings = activeBookings.length;
    const cancelledBookings = cancelledBookingsList.length;

    const totalContractValue = activeBookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);
    const totalAdvanceCollected = activeBookings.reduce((sum, b) => sum + (parseFloat(b.advance) || 0), 0);
    const pendingBalanceAmount = activeBookings.reduce((sum, b) => {
      const total = parseFloat(b.totalAmount) || 0;
      const advance = parseFloat(b.advance) || 0;
      return sum + Math.max(0, total - advance);
    }, 0);
    const bookingsWithPendingBalance = activeBookings.filter(b => {
      const total = parseFloat(b.totalAmount) || 0;
      const advance = parseFloat(b.advance) || 0;
      return (total - advance) > 0;
    }).length;
    
    const totalEnquiries = await Enquiry.count({ where: generalDateQuery });
    const newCustomers = await Customer.count({ where: generalDateQuery });

    // 3. Analytical Breakdowns
    const hallMap = {};
    activeBookings.forEach(b => {
      const hall = b.hallName || b.hallId || b.hall || "Main Hall"; 
      hallMap[hall] = (hallMap[hall] || 0) + 1;
    });
    const hallData = Object.keys(hallMap).map(name => ({ name, value: hallMap[name] }));

    const eventTypeMap = {};
    activeBookings.forEach(b => {
      const type = b.eventType || "Other";
      eventTypeMap[type] = (eventTypeMap[type] || 0) + 1;
    });
    const eventTypeData = Object.keys(eventTypeMap).map(name => ({ name, value: eventTypeMap[name] }));

    return res.json({
      success: true,
      data: {
        financials: { 
          totalRevenue, 
          totalExpenses, 
          netBalance,
          totalContractValue,
          totalAdvanceCollected,
          pendingBalanceAmount,
          bookingsWithPendingBalance
        },
        collections: { upi: upiCollected, bank: bankCollected, cash: cashCollected },
        operations: { totalBookings, cancelledBookings, totalEnquiries, newCustomers },
        analytics: { halls: hallData, eventTypes: eventTypeData },
        details: {
          recentBookings: activeBookings.slice(0, 20).map(b => {
            const total = parseFloat(b.totalAmount) || 0;
            const advance = parseFloat(b.advance) || 0;
            return {
              id: b.id,
              bookingId: b.bookingId,
              date: b.date,
              customerName: b.customerName,
              hall: b.hallName || b.hall || "Main Hall",
              status: b.status || "Confirmed",
              totalAmount: total,
              advance: advance,
              balanceAmount: total - advance
            };
          }),
          cancelledBookingsList: cancelledBookingsList.slice(0, 20).map(b => {
            const total = parseFloat(b.totalAmount) || 0;
            const advance = parseFloat(b.advance) || 0;
            return {
              id: b.id,
              bookingId: b.bookingId,
              date: b.date,
              customerName: b.customerName,
              hall: b.hallName || b.hall || "Main Hall",
              status: b.deletedAt ? "Cancelled" : (b.status || "Cancelled"),
              totalAmount: total,
              advance: advance,
              balanceAmount: total - advance,
              deletedAt: b.deletedAt,
              reason: b.cancellationReason || "Booking cancelled"
            };
          }),
          recentExpenses: expenses.slice(0, 20).map(e => ({
            id: e.id,
            date: e.date,
            category: e.category,
            description: e.description,
            amount: e.amount
          })),
          recentPayments: payments.slice(0, 20).map(p => ({
            id: p.id,
            paymentNumber: p.paymentNumber,
            paymentDate: p.paymentDate,
            method: p.paymentMode || p.method || "Payment",
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
