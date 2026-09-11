require("dotenv").config({ path: "./server/.env" });
const sequelize = require("./server/db");
const { Voucher, JournalEntry } = require("./server/models");

async function test() {
  await sequelize.authenticate();
  const vouchers = await Voucher.findAll({ raw: true });
  console.log("VOUCHERS COUNT:", vouchers.length);
  if (vouchers.length > 0) console.log("VOUCHER 0:", vouchers[0]);
  
  const journals = await JournalEntry.findAll({ raw: true });
  console.log("JOURNALS COUNT:", journals.length);
  if (journals.length > 0) console.log("JOURNAL 0:", journals[0]);
  
  process.exit(0);
}
test();
