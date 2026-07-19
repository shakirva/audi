require("dotenv").config();
const sequelize = require("./db");
async function fix() {
  try {
    await sequelize.query("ALTER TYPE \"enum_Users_role\" ADD VALUE IF NOT EXISTS 'Tester';");
    console.log("Enum altered successfully.");
  } catch(e) {
    console.error("ERROR:", e);
  } finally {
    process.exit();
  }
}
fix();
