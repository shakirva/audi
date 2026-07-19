/**
 * Seed script — populates the database with initial data.
 * Run: node seed.js
 */
require("dotenv").config();
const sequelize = require("./db");
const { Tenant, Environment, Subscription, User, Booking, Expense, Settings } = require("./models");

// ── Tenant ──
const DEFAULT_TENANT = {
  name: "Laural Garden Auditorium",
  slug: "laural-garden",
  ownerName: "Rajan P.K.",
  email: "owner@lauralgarden.com",
  phone: "+91 94470 12345",
  status: "active",
  sandboxEnabled: true,
  allowEnvironmentSwitch: true,
};

// ── Users ──
const USERS = [
  { name: "Rajan P.K.", email: "owner@lauralgarden.com", password: "owner123", role: "Owner", phone: "9447012345" },
  { name: "Suresh Kumar", email: "manager@lauralgarden.com", password: "manager123", role: "Manager", phone: "9447056789" },
  { name: "Anitha Nair", email: "staff@lauralgarden.com", password: "staff123", role: "Sales", phone: "9447098765" },
];

const SUPERADMIN = { name: "Platform Admin", email: "admin@venueza.com", password: "admin123", role: "SuperAdmin", phone: "" };

const HALLS = [
  { name: "Emerald Hall", icon: "🏛️", price: 120000, capacity: 800, description: "Premium AC Hall" },
  { name: "Royal Hall", icon: "👑", price: 85000, capacity: 500, description: "Luxury Banquet" },
  { name: "Orchid Hall", icon: "🌸", price: 50000, capacity: 200, description: "Intimate Gatherings" },
];

// Helper to generate random dates
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

const customerNames = [
  "Muhammed Rafi", "Shameer K", "Shabin Ali", "Riyas P", "Nabeel Rahman", "Ashraf K", 
  "Noufal", "Shameema", "Fathima", "Ramlath", "Sameeha", "Amina", "Jaseela", "Aslam", 
  "Faisal", "Shibil", "Nidhin", "Arjun", "Akhil", "Sreehari", "Nisha", "Anjali",
  "Ranjith", "Vishnu", "Meera", "Swathi", "Rahul", "Shanid", "Siddique", "Manoj"
];

const eventTypes = ["Wedding", "Reception", "Engagement", "Birthday", "Conference", "Corporate Meeting", "Nikkah", "Convention"];
const statuses = ["Agreement Pending", "Advance Pending", "Confirmed", "Completed"];

const BOOKINGS = [];

// Generate 120 bookings to simulate 120 customers and sufficient history
for (let i = 1; i <= 120; i++) {
  const isPast = i % 3 === 0; // 1/3rd are past events
  const status = isPast ? "Completed" : statuses[Math.floor(Math.random() * statuses.length)];
  const name = customerNames[Math.floor(Math.random() * customerNames.length)];
  const hall = HALLS[Math.floor(Math.random() * HALLS.length)];
  const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  
  BOOKINGS.push({
    bookingId: `BK${String(i).padStart(3, '0')}`,
    customerName: name,
    phone: `9447${Math.floor(100000 + Math.random() * 900000)}`,
    eventType: type,
    hall: hall.name,
    date: randomDate(new Date(2026, 4, 1), new Date(2026, 11, 31)),
    session: Math.random() > 0.5 ? "Full Day" : "Evening",
    guests: Math.floor(100 + Math.random() * 900),
    advance: Math.floor(10000 + Math.random() * 40000),
    totalAmount: hall.price + Math.floor(Math.random() * 50000),
    status: status,
    notes: `Demo data for ${name}`
  });
}

// Ensure specific today events exist to match dashboard
const today = new Date().toISOString().split("T")[0];
BOOKINGS.push({ bookingId: "BK901", customerName: "Shanid & Amina", phone: "9447999991", eventType: "Wedding", hall: "Emerald Hall", date: today, session: "Morning", guests: 600, advance: 50000, totalAmount: 150000, status: "Confirmed", notes: "VIP Event" });
BOOKINGS.push({ bookingId: "BK902", customerName: "ABC Builders", phone: "9447999992", eventType: "Corporate", hall: "Royal Hall", date: today, session: "Morning", guests: 200, advance: 20000, totalAmount: 80000, status: "Confirmed", notes: "Corporate Seminar" });
BOOKINGS.push({ bookingId: "BK903", customerName: "Ayaan Family", phone: "9447999993", eventType: "Birthday", hall: "Orchid Hall", date: today, session: "Evening", guests: 100, advance: 10000, totalAmount: 55000, status: "Confirmed", notes: "" });
BOOKINGS.push({ bookingId: "BK904", customerName: "Rashid & Sameeha", phone: "9447999994", eventType: "Reception", hall: "Emerald Hall", date: today, session: "Evening", guests: 500, advance: 30000, totalAmount: 120000, status: "Confirmed", notes: "" });

const EXPENSES = [];
for (let i = 1; i <= 30; i++) {
  EXPENSES.push({
    category: i % 2 === 0 ? "Maintenance" : "Utilities",
    description: `Operational Expense ${i}`,
    amount: 1000 + Math.floor(Math.random() * 10000),
    date: randomDate(new Date(2026, 4, 1), new Date(2026, 6, 31)),
    recurring: i % 5 === 0
  });
}

async function seed() {
  try {
    await sequelize.sync({ force: true });
    
    const tenant = await Tenant.create(DEFAULT_TENANT);
    const prodEnv = await Environment.create({ tenantId: tenant.id, name: "Production", type: "production", isDefault: true });
    
    await Subscription.create({
      tenantId: tenant.id, plan: "premium", status: "active",
      subscriptionStartDate: new Date().toISOString().split("T")[0],
      managedBy: "manual"
    });
    
    await User.create({ ...SUPERADMIN, tenantId: tenant.id });
    for (let u of USERS) { await User.create({ ...u, tenantId: tenant.id }); }
    
    const prodBookings = BOOKINGS.map(b => ({ ...b, tenantId: tenant.id, environmentId: prodEnv.id }));
    await Booking.bulkCreate(prodBookings);
    
    const prodExpenses = EXPENSES.map(e => ({ ...e, tenantId: tenant.id, environmentId: prodEnv.id }));
    await Expense.bulkCreate(prodExpenses);
    
    await Settings.create({ tenantId: tenant.id, environmentId: prodEnv.id, halls: HALLS });
    
    console.log("✅ Seed complete! Login credentials:");
    console.log("   Owner: owner@lauralgarden.com / owner123");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
