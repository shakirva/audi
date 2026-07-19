require("dotenv").config();
const { User, Tenant } = require("./models");
const jwt = require("jsonwebtoken");

async function debug() {
  try {
    const tenant = await Tenant.findOne({ where: { name: 'sample audi' } });
    const user = await User.findOne({ where: { tenantId: tenant.id, role: 'Tester' } });
    if (!user) return console.log("User not found!");
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    console.log("TOKEN:", token);
  } catch(e) { console.error(e); }
  process.exit();
}
debug();
