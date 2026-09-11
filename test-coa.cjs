require("dotenv").config();
const sequelize = require("./server/db");
const { ChartOfAccount } = require("./server/models");

async function test() {
  await sequelize.authenticate();
  const accounts = await ChartOfAccount.findAll({ raw: true, attributes: ['code', 'name'] });
  console.log(accounts);
  process.exit(0);
}
test();
