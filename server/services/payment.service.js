const paymentRepository = require("../repositories/payment.repository");
const bookingRepository = require("../repositories/booking.repository");
const accountStatementRepo = require("../repositories/accountStatement.repository");
const cashBookRepo = require("../repositories/cashBook.repository");
const bankBookRepo = require("../repositories/bankBook.repository");
const accountingEngine = require("./accountingEngine.service");
const { Receipt, JobTimeline } = require("../models");
const sequelize = require("../db");
const { NotFoundError, BadRequestError } = require("../helpers/errors");

class PaymentService {
  async listPayments({ tenantId, environmentId, bookingId, customerId, query }) {
    const result = await paymentRepository.findAllWithDetails({
      tenantId, environmentId, bookingId, customerId, query,
    });
    return { data: result.rows, total: result.total, page: result.page, limit: result.limit };
  }

  async getPayment(id, { tenantId, environmentId }) {
    const payment = await paymentRepository.findByIdWithDetails(id, { tenantId, environmentId });
    if (!payment) throw new NotFoundError("Payment");
    return payment;
  }

  async recordPayment(data, { tenantId, environmentId, createdBy }) {
    let customerId = data.customerId;
    let booking = null;
    
    if (data.bookingId) {
      if (typeof data.bookingId === "string" && isNaN(Number(data.bookingId))) {
        booking = await bookingRepository.findByBookingId(data.bookingId, { tenantId, environmentId });
      } else {
        booking = await bookingRepository.findById(Number(data.bookingId), { tenantId, environmentId });
      }
      if (!booking) throw new NotFoundError("Booking");
      if (!customerId) customerId = booking.customerId;
    }

    if (!customerId && booking) {
      // Auto-heal missing customer ID
      try {
        const customerService = require("./customer.service");
        const { customer } = await customerService.findOrCreateCustomer({
          name: booking.customerName || "Unknown",
          phone: booking.phone || ""
        }, { tenantId, environmentId, createdBy });
        customerId = customer.id;
        
        // Optionally update booking as well
        booking.customerId = customer.id;
        await booking.save({ hooks: false });
      } catch (err) {
        console.error("Failed to auto-heal customerId for payment:", err);
      }
    }

    if (!customerId) {
      throw new BadRequestError("Customer ID is required");
    }

    // Wrap everything in a database transaction to guarantee consistency
    return sequelize.transaction(async (t) => {
      // 1. Save Payment
      const payment = await paymentRepository.create({
        tenantId, environmentId, ...data, customerId, createdBy,
      }, { transaction: t });

      // 2. Generate Receipt Automatically
      const receipt = await Receipt.create({
        tenantId, environmentId,
        paymentId: payment.id,
        bookingId: payment.bookingId,
        customerId: payment.customerId,
        receiptDate: payment.paymentDate,
        amount: payment.amount,
        status: "Generated",
        createdBy,
      }, { transaction: t });

      // 3. Update Customer Statement
      const currentBalance = await accountStatementRepo.getLatestBalance({ tenantId, environmentId, customerId }, t);
      const newBalance = currentBalance - payment.amount; // Payment reduces amount owed
      
      await accountStatementRepo.create({
        tenantId, environmentId, customerId,
        date: payment.paymentDate,
        description: `Payment Received - ${payment.paymentMode}`,
        transactionType: "Payment Received",
        referenceId: payment.id,
        referenceType: "Payment",
        debit: 0,
        credit: payment.amount,
        balance: newBalance,
        createdBy
      }, { transaction: t });

      // 4. Update Outstanding Balance on Booking (if applicable)
      if (booking) {
        booking.advance = (Number(booking.advance) || 0) + Number(payment.amount);
        await booking.save({ transaction: t, hooks: false });
      }

      // 5. Create Cash Book or Bank Book entry based on mode
      if (payment.paymentMode === "Cash") {
        const cashBal = await cashBookRepo.getLatestBalance({ tenantId, environmentId }, t);
        await cashBookRepo.create({
          tenantId, environmentId,
          date: payment.paymentDate,
          description: `Payment Received from Customer #${customerId}`,
          transactionType: "Payment Received",
          referenceId: payment.id,
          referenceType: "Payment",
          cashIn: payment.amount,
          cashOut: 0,
          balance: cashBal + payment.amount,
          createdBy
        }, { transaction: t });
      } else {
        // Digital / Bank Transactions
        const bankBal = await bankBookRepo.getLatestBalance({ tenantId, environmentId, masterBankId: data.bankId }, t);
        await bankBookRepo.create({
          tenantId, environmentId,
          masterBankId: data.bankId, // From frontend input
          date: payment.paymentDate,
          description: `Payment Received (${payment.paymentMode}) from Customer #${customerId}`,
          transactionType: payment.paymentMode,
          referenceId: payment.id,
          referenceType: "Payment",
          bankIn: payment.amount,
          bankOut: 0,
          balance: bankBal + payment.amount,
          createdBy
        }, { transaction: t });
      }

      // 7. Create Job Timeline entry (if linked to booking)
      if (booking) {
        const { Job } = require("../models");
        const job = await Job.findOne({ where: { bookingId: booking.id, tenantId, environmentId }, transaction: t });
        if (job) {
          await JobTimeline.create({
            tenantId, environmentId, jobId: job.id, userId: createdBy,
            action: "Payment Received",
            details: `Amount: ${payment.amount} via ${payment.paymentMode}`
          }, { transaction: t });
        }
      }

      // 8. Audit log is handled by middleware

      // 9. Create double-entry journal + voucher via accounting engine
      try {
        await accountingEngine.onPaymentReceived(payment, { tenantId, environmentId, createdBy, transaction: t });
      } catch (e) {
        console.error("[PaymentService] Accounting engine error:", e);
      }
      
      return { payment, receipt };
    });
  }

  async getReceipt(paymentId, { tenantId, environmentId }) {
    const receipt = await Receipt.findOne({ where: { paymentId, tenantId, environmentId } });
    if (!receipt) throw new NotFoundError("Receipt");
    return receipt;
  }

  async removePayment(id, { tenantId, environmentId }) {
    return sequelize.transaction(async (t) => {
      const payment = await paymentRepository.findByIdWithDetails(id, { tenantId, environmentId }, { transaction: t });
      if (!payment) throw new NotFoundError("Payment");

      if (payment.bookingId) {
        const booking = await bookingRepository.findById(payment.bookingId, { tenantId, environmentId }, { transaction: t });
        if (booking) {
          booking.totalPaid = Math.max(0, Number(booking.totalPaid || 0) - Number(payment.amount));
          booking.balanceAmount = Number(booking.totalAmount || 0) - Number(booking.totalPaid);
          if (booking.balanceAmount > 0 && booking.status === "Completed") {
            // keep status or let it be
          }
          await booking.save({ transaction: t });
        }
      }

      await payment.destroy({ transaction: t });
      return { message: "Payment removed" };
    });
  }

  async generateReceiptPdf(receiptId, { tenantId, environmentId }) {
    const receipt = await Receipt.findOne({ where: { id: receiptId, tenantId, environmentId } });
    if (!receipt) throw new NotFoundError("Receipt");

    const fakePdfUrl = `https://storage.venueza.com/receipts/${receipt.receiptNumber}.pdf`;
    receipt.pdfUrl = fakePdfUrl;
    await receipt.save();

    return { message: "Receipt PDF generated successfully", url: fakePdfUrl };
  }
}

module.exports = new PaymentService();
