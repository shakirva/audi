const sequelize = require("../db");
const { Tenant, Environment, Customer, Booking, Payment, Expense } = require("../models");

const generateDemoData = async () => {
  try {
    console.log("🌱 Starting Venueza RC-1 Demo Data Seeder...");

    // 1. Ensure DB Sync
    await sequelize.sync();

    // 2. Get Default Tenant and Environment
    const tenant = await Tenant.findOne() || await Tenant.create({ name: "Demo Auditorium" });
    const environment = await Environment.findOne({ where: { tenantId: tenant.id } }) || await Environment.create({ name: "Production", type: "prod", tenantId: tenant.id });

    const tenantId = tenant.id;
    const environmentId = environment.id;

    // 3. Clean up existing demo data to prevent bloating (Optional, but safe for demo resets)
    console.log("🧹 Cleaning up old demo data...");
    await Expense.destroy({ where: { tenantId, environmentId }, force: true });
    await Payment.destroy({ where: { tenantId, environmentId }, force: true });
    await Booking.destroy({ where: { tenantId, environmentId }, force: true });
    await Customer.destroy({ where: { tenantId, environmentId }, force: true });

    // 4. Create Customers
    console.log("👥 Generating Customers...");
    const customers = [];
    const names = ["Aarav Sharma", "Vivaan Verma", "Aditya Patel", "Diya Singh", "Anya Gupta", "Corporate Solutions Ltd", "Tech Innovations Inc", "Priya Nair", "Rohan Iyer", "Kavya Desai"];
    
    for (let i = 0; i < names.length; i++) {
      const c = await Customer.create({
        tenantId,
        environmentId,
        name: names[i],
        phone: `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: `${names[i].split(" ")[0].toLowerCase()}@example.com`,
        address: "123 Demo Street, Bangalore"
      });
      customers.push(c);
    }

    // 5. Create 100 Bookings
    console.log("📅 Generating 100+ Realistic Bookings...");
    const eventTypes = ["Wedding", "Reception", "Corporate Event", "Birthday", "Seminar"];
    const halls = ["Grand Ballroom", "Royal Pavilion", "Silver Conference Room"];
    const statuses = ["Confirmed", "Pending", "Completed", "Cancelled"];
    
    let bookingPromises = [];
    for (let i = 1; i <= 100; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const totalAmount = Math.floor(Math.random() * (300000 - 50000 + 1) + 50000); // 50k to 3L
      const advance = Math.floor(totalAmount * 0.3); // 30% advance
      
      // Random date between 2 months ago and 6 months in the future
      const date = new Date();
      date.setDate(date.getDate() + (Math.floor(Math.random() * 240) - 60)); 
      
      let status = statuses[Math.floor(Math.random() * statuses.length)];
      if (date < new Date() && status !== "Cancelled") status = "Completed";

      bookingPromises.push(Booking.create({
        tenantId,
        environmentId,
        bookingId: `BKG-2026-${1000 + i}`,
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone,
        date: date.toISOString().split('T')[0],
        startTime: "10:00",
        endTime: "22:00",
        eventType,
        hall: halls[Math.floor(Math.random() * halls.length)],
        status,
        totalAmount,
        advance,
        remarks: "Demo auto-generated booking."
      }));
    }
    
    const bookings = await Promise.all(bookingPromises);

    // 6. Generate Payments and Expenses for Bookings
    console.log("💰 Generating Payments and Expenses...");
    
    for (const b of bookings) {
      if (b.status === "Cancelled") continue;

      // Advance Payment
      await Payment.create({
        tenantId,
        environmentId,
        bookingId: b.id,
        receiptNo: `RCP-${Math.floor(Math.random() * 90000) + 10000}`,
        amount: b.advance,
        paymentMode: Math.random() > 0.5 ? "Bank Transfer" : "Cash",
        status: "Success"
      });

      // If Completed, maybe full payment
      if (b.status === "Completed") {
        await Payment.create({
          tenantId,
          environmentId,
          bookingId: b.id,
          receiptNo: `RCP-${Math.floor(Math.random() * 90000) + 10000}`,
          amount: b.totalAmount - b.advance,
          paymentMode: "Bank Transfer",
          status: "Success"
        });
      }

      // Expenses
      if (Math.random() > 0.3) {
        await Expense.create({
          tenantId,
          environmentId,
          bookingId: b.id, // Associated with booking
          category: "Decoration",
          vendor: "Lumina Decorators",
          description: "Floral arrangement and stage setup",
          amount: Math.floor(b.totalAmount * 0.15), // 15% of revenue
          date: b.date
        });
      }

      if (Math.random() > 0.4 && (b.eventType === "Wedding" || b.eventType === "Reception")) {
        await Expense.create({
          tenantId,
          environmentId,
          bookingId: b.id,
          category: "Catering",
          vendor: "Alpha Catering",
          description: "Premium buffet",
          amount: Math.floor(b.totalAmount * 0.35), // 35% of revenue
          date: b.date
        });
      }
    }

    console.log("✅ Demo Data Seeding Complete!");
    console.log(`Created: 10 Customers, 100 Bookings, and associated Financials.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Failed:", error);
    process.exit(1);
  }
};

generateDemoData();
