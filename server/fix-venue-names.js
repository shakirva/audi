/**
 * Fix venue names — ensure each tenant's Settings has the correct venueName
 * Run on VPS: node server/fix-venue-names.js
 */
require('dotenv').config();
const sequelize = require('./db');

const fix = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.");

    // List all settings with their tenant info
    const [rows] = await sequelize.query(`
      SELECT s.id, s."venueName", s."tenantId", s."environmentId", 
             t.name AS "tenantName", t.slug, e.type AS "envType"
      FROM "Settings" s
      JOIN "Tenants" t ON t.id = s."tenantId"
      JOIN "Environments" e ON e.id = s."environmentId"
      ORDER BY t.slug, e.type;
    `);

    console.log("\n📋 Current Settings:");
    rows.forEach(r => {
      console.log(`  Tenant: ${r.tenantName} (${r.slug}) | Env: ${r.envType} | venueName: "${r.venueName}" | Settings ID: ${r.id}`);
    });

    // Fix: Set each tenant's venueName to match the tenant name if they don't match
    for (const row of rows) {
      // Skip if venueName already seems correct (matches tenant name)
      if (row.venueName && row.venueName.toLowerCase().includes(row.slug.replace(/-/g, ' ').toLowerCase())) {
        console.log(`  ✅ ${row.slug} (${row.envType}) — venueName "${row.venueName}" looks correct`);
        continue;
      }

      // If venueName doesn't match the tenant, log the mismatch
      console.log(`  ⚠️  MISMATCH: ${row.slug} (${row.envType}) — venueName is "${row.venueName}" but tenant is "${row.tenantName}"`);
      
      // Fix: Set venueName to the tenant's registered name
      await sequelize.query(`
        UPDATE "Settings" SET "venueName" = :tenantName WHERE id = :settingsId
      `, {
        replacements: { tenantName: row.tenantName, settingsId: row.id }
      });
      console.log(`  ✅ FIXED: ${row.slug} (${row.envType}) — venueName set to "${row.tenantName}"`);
    }

    console.log("\n✅ Done! All venue names verified and fixed.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

fix();
