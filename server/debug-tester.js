require("dotenv").config();
const { User, Tenant } = require("./models");

async function debug() {
  try {
    const tenant = await Tenant.findOne({ where: { name: 'sample audi' } });
    if (!tenant) {
      console.log("Tenant not found!");
      return;
    }
    console.log("Found tenant:", tenant.id, tenant.slug);

    const email = `tester@${tenant.slug}.com`;
    const password = "tester1234";

    let user = await User.findOne({ where: { tenantId: tenant.id, role: "Tester" } });
    if (user) {
      user.password = password;
      await user.save();
      console.log("User updated successfully");
    } else {
      user = await User.create({
        tenantId: tenant.id,
        name: "Sandbox Auditor",
        email,
        password,
        role: "Tester"
      });
      console.log("User created successfully:", user.id);
    }
  } catch(e) {
    console.error("DEBUG ERROR:", e.message);
    if (e.errors) {
      console.error("Validation errors:", e.errors.map(err => err.message));
    }
  } finally {
    process.exit();
  }
}
debug();
