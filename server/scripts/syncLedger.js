require("dotenv").config();
const { Payment, CashBook, BankBook } = require("../models");
const sequelize = require("../db");

async function sync() {
  await sequelize.authenticate();
  console.log("DB connected");
  
  const payments = await Payment.findAll({ order: [["createdAt", "ASC"]] });
  console.log(`Found ${payments.length} payments`);
  
  let cashBalance = 0;
  let bankBalance = 0;

  await CashBook.destroy({ where: {} });
  await BankBook.destroy({ where: {} });

  for (const payment of payments) {
    if (payment.paymentMode === "Cash") {
      cashBalance += payment.amount;
      await CashBook.create({
        tenantId: payment.tenantId,
        environmentId: payment.environmentId,
        date: payment.paymentDate,
        description: `Legacy Payment #${payment.paymentNumber}`,
        transactionType: "Payment Received",
        referenceId: payment.id,
        referenceType: "Payment",
        cashIn: payment.amount,
        cashOut: 0,
        balance: cashBalance,
      });
    } else {
      bankBalance += payment.amount;
      await BankBook.create({
        tenantId: payment.tenantId,
        environmentId: payment.environmentId,
        date: payment.paymentDate,
        description: `Legacy Payment #${payment.paymentNumber} (${payment.paymentMode})`,
        transactionType: payment.paymentMode,
        referenceId: payment.id,
        referenceType: "Payment",
        bankIn: payment.amount,
        bankOut: 0,
        balance: bankBalance,
      });
    }
  }
  
  console.log("Sync complete!");
  process.exit(0);
}

sync().catch(console.error);
