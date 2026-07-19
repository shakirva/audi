const { User, Tenant } = require("./models");

async function test() {
  try {
    const tenantId = 1; // Or any existing tenant
    const tenant = await Tenant.findByPk(tenantId);
    console.log("Tenant:", tenant?.slug);
    
    let user = await User.findOne({ where: { tenantId: tenant.id, role: "Tester" } });
    if (!user) {
      user = await User.create({
        tenantId: tenant.id,
        name: "Sandbox Auditor",
        email: `tester@${tenant.slug}.com`,
        password: "tester1234",
        role: "Tester"
      });
      console.log("User created:", user.id);
    } else {
      console.log("User exists:", user.id);
    }
  } catch(e) {
    console.error("ERROR:", e);
  }
}
test();
