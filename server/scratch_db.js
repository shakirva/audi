const sequelize = require('./db');
const { Payment } = require('./models');

async function test() {
  const tenantId = 1;
  const environmentId = 1; // Assuming default tenant and env for KT's Convention Centre

  const lifetimeCollectionsQuery = `
    SELECT 
      COALESCE(SUM(CASE WHEN "paymentMode" = 'Cash' THEN amount ELSE 0 END), 0) as "cashCollected",
      COALESCE(SUM(CASE WHEN "paymentMode" IN ('UPI', 'Bank Transfer', 'Card') THEN amount ELSE 0 END), 0) as "bankCollected",
      COUNT(*) as count
    FROM "Payments"
    WHERE "tenantId" = :tenantId AND "environmentId" = :environmentId AND status = 'Completed' AND "deletedAt" IS NULL
  `;

  const [result] = await sequelize.query(lifetimeCollectionsQuery, {
    replacements: { tenantId, environmentId },
    type: sequelize.QueryTypes.SELECT
  });

  console.log("SQL Result:", result);

  const payments = await Payment.findAll({
    where: { tenantId, environmentId, status: 'Completed' },
    raw: true
  });
  
  let totalCash = 0;
  let totalBank = 0;
  payments.forEach(p => {
    if(p.paymentMode === 'Cash') totalCash += p.amount;
    else if(['UPI', 'Bank Transfer', 'Card'].includes(p.paymentMode)) totalBank += p.amount;
  });
  
  console.log("ORM Result:", { totalCash, totalBank, count: payments.length });
  process.exit();
}
test();
