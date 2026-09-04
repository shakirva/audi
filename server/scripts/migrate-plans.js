require('dotenv').config();
const sequelize = require('../db');
const Subscription = require('../models/Subscription');

(async () => {
  try {
    // Add new enum values if not exist
    await sequelize.query(`ALTER TYPE "enum_Subscriptions_plan" ADD VALUE IF NOT EXISTS 'lifetime';`);
    await sequelize.query(`ALTER TYPE "enum_Subscriptions_plan" ADD VALUE IF NOT EXISTS 'starter';`);
    await sequelize.query(`ALTER TYPE "enum_Subscriptions_plan" ADD VALUE IF NOT EXISTS 'professional';`);
    await sequelize.query(`ALTER TYPE "enum_Subscriptions_plan" ADD VALUE IF NOT EXISTS 'business';`);
    
    // Update existing subscriptions
    await sequelize.query(`UPDATE "Subscriptions" SET plan = 'lifetime' WHERE plan = 'premium';`);
    await sequelize.query(`UPDATE "Subscriptions" SET plan = 'starter' WHERE plan = 'basic';`);
    await sequelize.query(`UPDATE "Subscriptions" SET plan = 'business' WHERE plan = 'enterprise';`);
    
    console.log('Successfully migrated plan ENUM values in DB.');
    process.exit(0);
  } catch(e) {
    console.error(e.message);
    process.exit(1);
  }
})();
