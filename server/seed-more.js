require("dotenv").config();
const sequelize = require("./db");
const { Tenant, Environment, Booking, Expense } = require("./models");

const MORE_SANDBOX_BOOKINGS = [
  { bookingId: "BK051", customerName: "Rahul & Sneha (Sandbox)", phone: "9000000010", eventType: "Wedding", hall: "Main Hall", date: "2026-07-02", session: "Full Day", guests: 400, advance: 15000, totalAmount: 45000, status: "Confirmed", notes: "Sandbox test booking" },
  { bookingId: "BK052", customerName: "TechCorp Meetup", phone: "9000000011", eventType: "Conference", hall: "Mini Hall", date: "2026-07-05", session: "Morning", guests: 80, advance: 5000, totalAmount: 12000, status: "Confirmed", notes: "Sandbox test booking" },
  { bookingId: "BK053", customerName: "Ayesha's Birthday", phone: "9000000012", eventType: "Birthday", hall: "Open Stage", date: "2026-07-08", session: "Evening", guests: 150, advance: 2000, totalAmount: 8000, status: "Pending Payment", notes: "Sandbox test booking" },
  { bookingId: "BK054", customerName: "John's Baptism", phone: "9000000013", eventType: "Baptism", hall: "Mini Hall", date: "2026-07-12", session: "Morning", guests: 100, advance: 4000, totalAmount: 10000, status: "Confirmed", notes: "Sandbox test booking" },
  { bookingId: "BK055", customerName: "Karthik Family", phone: "9000000014", eventType: "Reception", hall: "Main Hall", date: "2026-07-15", session: "Evening", guests: 300, advance: 0, totalAmount: 25000, status: "Enquiry", notes: "Sandbox test booking" },
  { bookingId: "BK056", customerName: "Anita & Rohit", phone: "9000000015", eventType: "Engagement", hall: "Mini Hall", date: "2026-07-20", session: "Morning", guests: 120, advance: 5000, totalAmount: 15000, status: "Confirmed", notes: "Sandbox test booking" },
  { bookingId: "BK057", customerName: "Nair Family Meet", phone: "9000000016", eventType: "Other", hall: "Open Stage", date: "2026-07-24", session: "Full Day", guests: 200, advance: 8000, totalAmount: 18000, status: "Confirmed", notes: "Sandbox test booking" },
  { bookingId: "BK058", customerName: "Sneha & Vishnu", phone: "9000000017", eventType: "Wedding", hall: "Main Hall", date: "2026-07-28", session: "Full Day", guests: 500, advance: 20000, totalAmount: 50000, status: "Pending Payment", notes: "Sandbox test booking" },
  { bookingId: "BK059", customerName: "Global Tech Summit", phone: "9000000018", eventType: "Conference", hall: "Main Hall", date: "2026-07-30", session: "Full Day", guests: 600, advance: 30000, totalAmount: 60000, status: "Confirmed", notes: "Sandbox test booking" },
];

const MORE_SANDBOX_EXPENSES = [
  { category: "Staff Salaries", description: "Sandbox Manager Salary (July)", amount: 35000, date: "2026-07-01", recurring: true },
  { category: "Maintenance", description: "Sandbox AC Repair", amount: 4500, date: "2026-07-05", recurring: false },
  { category: "Utilities", description: "Sandbox Electricity Bill (June)", amount: 18000, date: "2026-07-10", recurring: true },
  { category: "Miscellaneous", description: "Sandbox Office Supplies", amount: 2000, date: "2026-07-15", recurring: false },
  { category: "Catering Prep", description: "Sandbox Kitchen Restock", amount: 8000, date: "2026-07-20", recurring: false },
];

async function seedMore() {
  try {
    const tenant = await Tenant.findOne({ where: { slug: "sreelakshmi" } });
    if (!tenant) throw new Error("Tenant not found");

    const sandboxEnv = await Environment.findOne({ where: { tenantId: tenant.id, type: "sandbox" } });
    if (!sandboxEnv) throw new Error("Sandbox env not found");

    const sandboxBookings = MORE_SANDBOX_BOOKINGS.map(b => ({ ...b, tenantId: tenant.id, environmentId: sandboxEnv.id }));
    await Booking.bulkCreate(sandboxBookings);
    console.log(`🧪 Added ${MORE_SANDBOX_BOOKINGS.length} sandbox bookings`);

    const sandboxExpenses = MORE_SANDBOX_EXPENSES.map(e => ({ ...e, tenantId: tenant.id, environmentId: sandboxEnv.id }));
    await Expense.bulkCreate(sandboxExpenses);
    console.log(`🧪 Added ${MORE_SANDBOX_EXPENSES.length} sandbox expenses`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seedMore();
