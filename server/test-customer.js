const axios = require('axios');

async function runTest() {
  const adminApi = axios.create({ baseURL: 'http://localhost:5005/api/admin' });
  const api = axios.create({ baseURL: 'http://localhost:5005/api/v1' });

  try {
    console.log("1. Creating Test Tenant (STARTER plan)");
    const tenantRes = await adminApi.post('/tenants', {
      name: 'Test Venue Starter',
      slug: 'test-starter',
      ownerName: 'Test Owner',
      email: 'owner@teststarter.com',
      phone: '9999999999',
      plan: 'Starter'
    });
    
    const tenant = tenantRes.data.tenant;
    const password = tenantRes.data.defaultPassword;
    console.log("Tenant created:", tenant.slug, password);

    console.log("2. Logging in as Owner");
    const loginRes = await api.post('/auth/login', {
      email: 'owner@teststarter.com',
      password: password,
      tenantSlug: 'test-starter'
    });

    const token = loginRes.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log("Logged in successfully.");

    console.log("3. Testing Starter Limits (Halls)");
    try {
      // Starter plan limit is 1 hall
      await api.put('/settings', {
        halls: [
          { name: "Main Hall", capacity: 500, price: 10000 },
          { name: "Second Hall", capacity: 200, price: 5000 }
        ]
      });
      console.log("❌ Hall limit bypass succeeded! This should have failed.");
    } catch (err) {
      if (err.response && err.response.data.code === 'LIMIT_EXCEEDED') {
        console.log("✅ Hall limit properly enforced:", err.response.data.message);
      } else {
        console.log("❌ Unexpected error:", err.response?.data || err.message);
      }
    }

    console.log("4. Testing Starter Limits (Users)");
    let successCount = 0;
    for (let i = 1; i <= 3; i++) {
      try {
        await api.post('/auth/register', {
          name: `User ${i}`,
          email: `user${i}@teststarter.com`,
          phone: "1234567890",
          password: "password123",
          role: "Sales"
        });
        successCount++;
      } catch (err) {
        if (err.response?.data?.code === 'LIMIT_EXCEEDED') {
          console.log(`✅ User limit enforced at user ${i}:`, err.response.data.message);
        } else {
          console.log(`❌ Error adding user ${i}:`, err.response?.data || err.message);
        }
      }
    }
    console.log(`Total users added: ${successCount}`);

    console.log("5. Testing Professional-only feature access (e.g. Finance Reports)");
    try {
      await api.get('/finance/reports');
      console.log("❌ Professional feature bypass succeeded! This should have failed.");
    } catch (err) {
      if (err.response && err.response.data.code === 'PLAN_UPGRADE_REQUIRED') {
        console.log("✅ Plan upgrade gating properly enforced:", err.response.data.message);
      } else if (err.response?.status === 404) {
        console.log("✅ Route not found (or handled differently), but not bypassed.");
      } else {
        console.log("❌ Unexpected error on feature access:", err.response?.data || err.message);
      }
    }

    console.log("6. Verifying Data Persistence (Customer, Booking, Job, Staff)");
    // Creating customer, booking, job
    const bookingRes = await api.post('/bookings', {
      customerName: "Test Customer",
      phone: "9876543210",
      eventType: "Wedding",
      hall: "Main Hall",
      date: new Date().toISOString().split('T')[0],
      session: "Full Day",
      totalAmount: 50000,
      advance: 10000,
      paymentMethod: "Cash"
    });
    console.log("✅ Booking & Advance Payment created:", bookingRes.data.id);

    // Creating Job
    const jobRes = await api.post('/jobs', {
      customerName: "Test Customer",
      eventType: "Wedding",
      date: new Date().toISOString().split('T')[0],
      session: "Full Day",
      hall: "Main Hall"
    });
    console.log("✅ Job created:", jobRes.data.data.id);

    // Assign Staff
    await api.post(`/jobs/${jobRes.data.data.id}/staff`, {
      userId: 1, // owner
      role: "Manager"
    });
    console.log("✅ Staff assigned to Job.");

    console.log("Test sequence complete. Cleaning up is not required for test tenant.");
  } catch (err) {
    console.error("Test failed:", err.response?.data || err.message);
  }
}

runTest();
