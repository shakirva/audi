const { Op } = require("sequelize");
const {
  Booking,
  Customer,
  Payment,
  Receipt,
  Expense,
  Voucher,
  AuditLog,
  AccountStatement
} = require("../models");
const AppError = require("../helpers/appError");

exports.getBookingSummary = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const environmentId = req.user.environmentId;
    const bookingId = req.params.id; // Usually the PK or string ID, assuming bookingId string here

    // Find the booking
    const booking = await Booking.findOne({
      where: { bookingId, tenantId, environmentId },
      include: [
        { model: Customer, as: "Customer", required: false }
      ]
    });

    if (!booking) {
      return next(new AppError("Booking not found", 404));
    }

    // Fetch related records concurrently
    const [payments, expenses, auditLogs, statements] = await Promise.all([
      Payment.findAll({
        where: { bookingId: booking.id, tenantId, environmentId },
        order: [["createdAt", "DESC"]]
      }),
      Expense.findAll({
        where: { bookingId: booking.id, tenantId, environmentId },
        order: [["createdAt", "DESC"]]
      }),
      AuditLog.findAll({
        where: { recordId: booking.id, recordType: "Booking", tenantId, environmentId },
        order: [["createdAt", "DESC"]]
      }),
      AccountStatement.findAll({
        where: { bookingId: booking.id, tenantId, environmentId },
        order: [["createdAt", "ASC"]]
      })
    ]);

    // Compute financial summary
    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const outstandingBalance = booking.totalAmount - totalCollected;
    const netProfit = booking.totalAmount - totalExpenses;
    const profitMargin = booking.totalAmount > 0 ? ((netProfit / booking.totalAmount) * 100).toFixed(2) : 0;

    // Combine documents (Receipts generated from payments, vouchers from expenses, etc. Mocked for now)
    const documents = payments.map(p => ({
      id: p.id,
      type: "Receipt",
      ref: p.receiptNo || `RCPT-${p.id}`,
      date: p.createdAt,
      amount: p.amount
    })).concat(expenses.map(e => ({
      id: e.id,
      type: "Voucher",
      ref: e.voucherNo || `VOU-${e.id}`,
      date: e.createdAt,
      amount: e.amount
    })));

    res.status(200).json({
      status: "success",
      data: {
        overview: {
          bookingId: booking.bookingId,
          customerName: booking.Customer ? booking.Customer.name : booking.customerName,
          customerPhone: booking.Customer ? booking.Customer.phone : booking.phone,
          eventType: booking.eventType,
          date: booking.date,
          status: booking.status,
          hall: booking.hall
        },
        financialSummary: {
          totalAmount: booking.totalAmount,
          advance: booking.advance,
          totalCollected,
          outstandingBalance: outstandingBalance > 0 ? outstandingBalance : 0,
          totalExpenses,
          netProfit,
          profitMargin
        },
        paymentTimeline: payments.map(p => ({
          id: p.id,
          receiptNo: p.receiptNo || "N/A",
          date: p.date || p.createdAt,
          amount: p.amount,
          mode: p.paymentMode,
          status: p.status
        })),
        statement: statements.map(s => ({
          id: s.id,
          date: s.date,
          desc: s.description,
          debit: s.debit,
          credit: s.credit,
          balance: s.runningBalance
        })),
        expenses: expenses.map(e => ({
          id: e.id,
          category: e.category,
          vendor: e.vendor,
          amount: e.amount,
          status: e.status,
          notes: e.notes
        })),
        documents,
        auditLogs: auditLogs.map(a => ({
          id: a.id,
          action: a.action,
          details: a.details,
          date: a.createdAt,
          user: a.performedBy || "System"
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getBookingProfitReport = async (req, res, next) => {
  try {
    const { tenantId, environmentId } = req.user;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const bookings = await Booking.findAll({
      where: { tenantId, environmentId, ...dateFilter },
      include: [
        { model: Customer, as: "Customer", required: false }
      ],
      order: [["createdAt", "DESC"]],
      limit: 500
    });

    if (!bookings.length) {
      return res.status(200).json({
        status: "success",
        data: { list: [], summary: { totalRevenue: 0, totalExpenses: 0, netProfit: 0, avgMargin: 0 } }
      });
    }

    const bookingIds = bookings.map(b => b.id);

    const [payments, expenses] = await Promise.all([
      Payment.findAll({ where: { bookingId: bookingIds, tenantId, environmentId, status: "Success" } }),
      Expense.findAll({ where: { bookingId: bookingIds, tenantId, environmentId } })
    ]);

    let totalRevenue = 0;
    let totalExpensesSum = 0;

    const list = bookings.map(b => {
      const bPayments = payments.filter(p => p.bookingId === b.id);
      const bExpenses = expenses.filter(e => e.bookingId === b.id);

      const revenue = b.totalAmount || 0;
      const bExpenseTotal = bExpenses.reduce((sum, e) => sum + e.amount, 0);
      const profit = revenue - bExpenseTotal;
      const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;

      totalRevenue += revenue;
      totalExpensesSum += bExpenseTotal;

      return {
        id: b.bookingId,
        customer: b.Customer ? b.Customer.name : b.customerName,
        date: b.date,
        revenue,
        expenses: bExpenseTotal,
        profit,
        margin: parseFloat(margin),
        status: b.status
      };
    });

    const netProfit = totalRevenue - totalExpensesSum;
    const avgMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    res.status(200).json({
      status: "success",
      data: {
        list,
        summary: {
          totalRevenue,
          totalExpenses: totalExpensesSum,
          netProfit,
          avgMargin: parseFloat(avgMargin)
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.getExpenseCategoriesReport = async (req, res, next) => {
  try {
    const { tenantId, environmentId } = req.user;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const expenses = await Expense.findAll({
      where: { tenantId, environmentId, ...dateFilter }
    });

    const categoryMap = {};
    let totalAll = 0;

    expenses.forEach(e => {
      const cat = e.category || "Uncategorized";
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, total: 0, thisMonth: 0, lastMonth: 0 };
      }
      categoryMap[cat].total += e.amount;
      totalAll += e.amount;

      // Mock date logic for This Month / Last Month
      const d = new Date(e.date || e.createdAt);
      const now = new Date();
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        categoryMap[cat].thisMonth += e.amount;
      } else if (d.getMonth() === (now.getMonth() - 1 + 12) % 12) {
        categoryMap[cat].lastMonth += e.amount;
      }
    });

    const list = Object.values(categoryMap).map(c => {
      const trend = c.lastMonth === 0 ? 100 : ((c.thisMonth - c.lastMonth) / c.lastMonth) * 100;
      return {
        ...c,
        percentage: totalAll > 0 ? ((c.total / totalAll) * 100).toFixed(1) : 0,
        trend: parseFloat(trend.toFixed(1))
      };
    }).sort((a, b) => b.total - a.total);

    res.status(200).json({
      status: "success",
      data: {
        list,
        summary: { totalExpenses: totalAll }
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.getVendorOutstandingReport = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const environmentId = req.user.environmentId;

    const vendors = await require("../models/Vendor").findAll({
      where: { tenantId, environmentId },
      include: [{ model: Expense, as: 'Expenses', required: false }]
    });

    const list = vendors.map(v => {
      const expenses = v.Expenses || [];
      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      
      // Mocking paid for now, since Vendor Payments logic isn't fully robust
      const paid = 0; 
      const outstanding = total - paid;
      
      return {
        id: v.id,
        name: v.name,
        category: v.category,
        invoiceNo: `MULTIPLE`,
        total,
        paid,
        outstanding,
        dueDate: new Date().toISOString(),
        status: outstanding > 0 ? "Pending" : "Settled"
      };
    });

    const totalOutstanding = list.reduce((sum, item) => sum + item.outstanding, 0);
    const overdueAmount = list.filter(i => i.status === "Overdue").reduce((sum, item) => sum + item.outstanding, 0);

    res.status(200).json({
      status: "success",
      data: {
        list,
        summary: { totalOutstanding, overdueAmount }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentHistoryReport = async (req, res, next) => {
  try {
    const { tenantId, environmentId } = req.user;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    // Fetch payments and expenses to unify them
    const [payments, expenses] = await Promise.all([
      Payment.findAll({ where: { tenantId, environmentId, ...dateFilter }, include: [{ model: Booking, as: 'Booking', required: false }] }),
      Expense.findAll({ where: { tenantId, environmentId, ...dateFilter } })
    ]);

    const history = [];

    payments.forEach(p => {
      history.push({
        id: `PAY-${p.id}`,
        date: p.createdAt,
        ref: p.receiptNo || `RCP-${p.id}`,
        bookingId: p.bookingId,
        party: p.Booking ? (p.Booking.customerName || "Customer") : "Customer",
        type: "Receipt",
        mode: p.paymentMode || "Cash",
        amount: p.amount,
        status: p.status,
        createdBy: "System"
      });
    });

    expenses.forEach(e => {
      history.push({
        id: `EXP-${e.id}`,
        date: e.createdAt,
        ref: `VOU-${e.id}`,
        bookingId: e.bookingId || "-",
        party: e.vendor || "Vendor",
        type: "Expense",
        mode: "Bank Transfer", // Defaulting for demo
        amount: e.amount,
        status: "Completed",
        createdBy: "System"
      });
    });

    // Sort by date DESC
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      status: "success",
      data: { list: history }
    });
  } catch (error) {
    next(error);
  }
};

exports.getCashClosingReport = async (req, res, next) => {
  try {
    const { tenantId, environmentId } = req.user;
    const { startDate, endDate } = req.query;
    
    // Default to today if no date passed
    const filterStart = startDate ? new Date(startDate) : new Date();
    const filterEnd = endDate ? new Date(endDate) : new Date();
    filterStart.setHours(0,0,0,0);
    filterEnd.setHours(23,59,59,999);

    const dateFilter = { createdAt: { [Op.between]: [filterStart, filterEnd] } };

    const [payments, expenses] = await Promise.all([
      Payment.findAll({ where: { tenantId, environmentId, paymentMode: "Cash", ...dateFilter } }),
      Expense.findAll({ where: { tenantId, environmentId, ...dateFilter } })
    ]);

    // Dummy opening cash logic since we don't have a rigid till-management schema yet
    const openingCash = 15000; 
    
    const cashReceived = payments.reduce((sum, p) => sum + p.amount, 0);
    const cashPaid = expenses.reduce((sum, e) => sum + e.amount, 0); // Assuming all expenses paid in cash from till
    const refunds = 0; // Implement refund logic if Model exists
    
    const expectedClosing = openingCash + cashReceived - cashPaid - refunds;
    const closingCash = expectedClosing; // Assuming perfectly balanced for now

    res.status(200).json({
      status: "success",
      data: {
        openingCash,
        cashReceived,
        cashPaid,
        refunds,
        closingCash,
        expectedClosing,
        difference: closingCash - expectedClosing,
        closedBy: req.user.name || "Manager",
        closingTime: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getDailyBusinessSummary = async (req, res, next) => {
  try {
    const { tenantId, environmentId } = req.user;
    const { startDate, endDate } = req.query;

    const filterStart = startDate ? new Date(startDate) : new Date();
    const filterEnd = endDate ? new Date(endDate) : new Date();
    filterStart.setHours(0,0,0,0);
    filterEnd.setHours(23,59,59,999);

    const dateFilter = { createdAt: { [Op.between]: [filterStart, filterEnd] } };

    const [bookings, payments, expenses] = await Promise.all([
      Booking.findAll({ where: { tenantId, environmentId, ...dateFilter } }),
      Payment.findAll({ where: { tenantId, environmentId, ...dateFilter } }),
      Expense.findAll({ where: { tenantId, environmentId, ...dateFilter } })
    ]);

    const bookingsCreated = bookings.length;
    const eventsConducted = bookings.filter(b => b.status === "Completed").length;
    const revenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const expensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    const cashCollection = payments.filter(p => p.paymentMode === "Cash").reduce((sum, p) => sum + p.amount, 0);
    const bankCollection = payments.filter(p => p.paymentMode !== "Cash").reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      status: "success",
      data: {
        bookingsCreated,
        eventsConducted,
        revenue,
        expenses: expensesTotal,
        netProfit: revenue - expensesTotal,
        cashCollection,
        bankCollection,
        outstandingCollected: 0,
        refunds: 0,
        netCashPosition: cashCollection + bankCollection - expensesTotal,
        topBooking: bookings.length > 0 ? bookings[0].bookingId : "N/A",
        topExpense: expenses.length > 0 ? expenses[0].category : "N/A"
      }
    });
  } catch (error) {
    next(error);
  }
};
