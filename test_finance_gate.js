const { Subscription, Tenant } = require("./server/models");
const request = require("supertest");
const app = require("./server/app");
const { generateToken } = require("./server/helpers/jwt");

async function runTests() {
  const tenantId = 19; // QA Test Auditorium
  const userId = 5; // A valid user in that tenant (assuming admin or owner)
  
  // 1. Generate token
  const token = generateToken({ id: userId, tenantId, role: "Owner" });
  
  const headers = { Authorization: `Bearer ${token}` };
  const testRoutes = [
    { path: "/api/v1/accounts/dashboard", expectedStatus: { starter: 403, professional: 200, business: 200, lifetime: 200 } },
    { path: "/api/v1/accounts/booking-ledger/1", expectedStatus: { starter: 403, professional: 200, business: 200, lifetime: 200 } },
    { path: "/api/v1/accounts/profit-loss", expectedStatus: { starter: 200, professional: 200, business: 200, lifetime: 200 } }
  ];

  const plans = ["starter", "professional", "business", "lifetime"];

  for (const plan of plans) {
    console.log(`\n=== Testing plan: ${plan.toUpperCase()} ===`);
    // Update plan
    await Subscription.update({ plan }, { where: { tenantId } });
    
    for (const route of testRoutes) {
      const res = await request(app).get(route.path).set(headers);
      
      const expected = route.expectedStatus[plan];
      const result = res.status === expected ? "✅ PASS" : `❌ FAIL (got ${res.status}, expected ${expected})`;
      
      console.log(`${result} | ${route.path} -> ${res.status}`);
      if (res.status === 403) {
        console.log(`      Error: ${res.body.code} - ${res.body.message}`);
      }
    }
  }

  // Restore to lifetime (or whatever it was)
  await Subscription.update({ plan: "lifetime" }, { where: { tenantId } });
  console.log("\nRestored QA tenant to lifetime plan.");
  process.exit(0);
}

runTests().catch(err => { console.error(err); process.exit(1); });
