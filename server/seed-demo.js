require("dotenv").config();
const sequelize = require("./db");
const { 
  Tenant, Environment, Subscription, User, 
  Customer, Enquiry, Booking, Agreement, Payment, Receipt, 
  Job, JobTimeline, JobStaff, JobChecklist, Expense, Settings 
} = require("./models");

const DEFAULT_TENANT = {
  name: "Our Venue",
  slug: "demo-venue",
  ownerName: "Rajan P.K.",
  email: "owner@venue.com",
  phone: "+91 94470 12345",
  status: "active",
  sandboxEnabled: true,
  allowEnvironmentSwitch: true,
};

const USERS = [
  { name: "Rajan P.K.", email: "owner@venue.com", password: "owner123", role: "Owner", phone: "9447012345" },
  { name: "Suresh Kumar", email: "manager@venue.com", password: "manager123", role: "Manager", phone: "9447056789" },
  { name: "Anitha Nair", email: "staff@venue.com", password: "staff123", role: "Sales", phone: "9447098765" },
  { name: "Siddique", email: "accountant@venue.com", password: "acc123", role: "Operations", phone: "9447011111" },
];

for (let i = 0; i < 14; i++) {
  USERS.push({
    name: `Staff ${i+5}`, email: `staff${i+5}@venue.com`, password: "pass", role: "Operations", phone: `94470111${String(i+10).padStart(2, '0')}`
  });
}

const SUPERADMIN = { name: "Platform Admin", email: "admin@venueza.com", password: "admin123", role: "SuperAdmin", phone: "" };

const HALLS = [
  { name: "Emerald Hall", icon: "🏛️", price: 120000, capacity: 800, description: "Premium AC Hall" },
  { name: "Royal Hall", icon: "👑", price: 85000, capacity: 500, description: "Luxury Banquet" },
  { name: "Orchid Hall", icon: "🌸", price: 50000, capacity: 200, description: "Intimate Gatherings" },
];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function rDateStr(start, end) {
  return randomDate(start, end).toISOString().split('T')[0];
}

const customerNames = [
  "Muhammed Rafi", "Shameer K", "Shabin Ali", "Riyas P", "Nabeel Rahman", "Ashraf K", 
  "Noufal", "Shameema", "Fathima", "Ramlath", "Sameeha", "Amina", "Jaseela", "Aslam", 
  "Faisal", "Shibil", "Nidhin", "Arjun", "Akhil", "Sreehari", "Nisha", "Anjali",
  "Ranjith", "Vishnu", "Meera", "Swathi", "Rahul", "Shanid", "Siddique", "Manoj"
];
const eventTypes = ["Wedding", "Reception", "Engagement", "Birthday", "Corporate", "Nikkah"];

async function seed() {
  try {
    await sequelize.sync({ force: true });
    
    // 1. Core Config
    const tenant = await Tenant.create(DEFAULT_TENANT);
    const prodEnv = await Environment.create({ tenantId: tenant.id, name: "Production", type: "production", isDefault: true });
    
    await Subscription.create({
      tenantId: tenant.id, plan: "premium", status: "active",
      subscriptionStartDate: new Date().toISOString().split("T")[0],
      managedBy: "manual"
    });
    
    await Settings.create({ tenantId: tenant.id, environmentId: prodEnv.id, halls: HALLS });
    
    // 2. Users (Staff)
    await User.create({ ...SUPERADMIN, tenantId: tenant.id });
    const createdUsers = [];
    for (let u of USERS) { 
      const user = await User.create({ ...u, tenantId: tenant.id });
      createdUsers.push(user);
    }
    const adminUserId = createdUsers[0].id;
    const salesUserId = createdUsers[2].id;

    console.log("Creating 120 Customers...");
    const customers = [];
    for (let i=0; i<120; i++) {
      const c = await Customer.create({
        tenantId: tenant.id, environmentId: prodEnv.id,
        name: `${customerNames[i % customerNames.length]} ${i}`,
        phone: `9447${String(i).padStart(6, '0')}`,
        email: `cust${i}@example.com`,
        status: "Active",
        source: i % 3 === 0 ? "Walk-in" : "Social Media",
        createdBy: salesUserId
      });
      customers.push(c);
    }

    console.log("Creating 80 Enquiries...");
    const enquiries = [];
    for (let i=0; i<80; i++) {
      const e = await Enquiry.create({
        tenantId: tenant.id, environmentId: prodEnv.id,
        customerId: customers[i].id,
        enquiryNumber: `ENQ-100${i}`,
        eventType: eventTypes[i % eventTypes.length],
        hallPreference: HALLS[i % HALLS.length].name,
        tentativeDate: rDateStr(new Date(2026, 4, 1), new Date(2026, 11, 31)),
        session: i % 2 === 0 ? "Full Day" : "Evening",
        guestCount: 100 + (i * 10),
        status: i < 45 ? "Booking Confirmed" : "New Enquiry",
        salesExecutiveId: salesUserId,
        createdBy: salesUserId
      });
      enquiries.push(e);
    }

    console.log("Creating 45 Bookings & Agreements & Jobs & Payments...");
    // Out of 80 enquiries, 45 are converted to bookings.
    const bookings = [];
    for (let i=0; i<45; i++) {
      const enq = enquiries[i];
      const isPast = i % 4 === 0;
      const status = isPast ? "Completed" : (i % 3 === 0 ? "Advance Pending" : "Confirmed");
      const totalAmount = HALLS.find(h => h.name === enq.hallPreference).price + 20000;
      const advance = Math.floor(totalAmount * 0.3);

      const b = await Booking.create({
        tenantId: tenant.id, environmentId: prodEnv.id,
        bookingId: `BK-100${i}`,
        customerId: enq.customerId,
        enquiryId: enq.id,
        customerName: customers[i].name,
        phone: customers[i].phone,
        eventType: enq.eventType,
        hall: enq.hallPreference,
        date: enq.tentativeDate,
        session: enq.session,
        guests: enq.guestCount,
        totalAmount,
        advance,
        status,
        createdBy: salesUserId
      });
      bookings.push(b);

      // Agreements (40 out of 45)
      if (i < 40) {
        await Agreement.create({
          tenantId: tenant.id, environmentId: prodEnv.id,
          bookingId: b.id,
          customerId: b.customerId,
          agreementNumber: `AGR-200${i}`,
          totalValue: totalAmount,
          advancePaid: advance,
          status: isPast ? "Signed" : "Draft",
          createdBy: adminUserId
        });
      }

      // Payments (90 payments roughly across these 45 bookings)
      // Payment 1: Advance
      const p1 = await Payment.create({
        tenantId: tenant.id, environmentId: prodEnv.id,
        paymentNumber: `PAY-400${i}`,
        bookingId: b.id,
        customerId: b.customerId,
        amount: advance,
        paymentType: "Advance",
        paymentMode: i % 2 === 0 ? "Bank Transfer" : "UPI",
        paymentDate: new Date().toISOString().split("T")[0],
        status: "Completed",
        createdBy: salesUserId
      });
      await Receipt.create({
        tenantId: tenant.id, environmentId: prodEnv.id,
        receiptNumber: `REC-400${i}`,
        paymentId: p1.id, bookingId: b.id, customerId: b.customerId,
        receiptDate: new Date().toISOString().split("T")[0], amount: advance, status: "Generated", createdBy: salesUserId
      });

      if (isPast) {
        // Payment 2: Balance
        const p2 = await Payment.create({
          tenantId: tenant.id, environmentId: prodEnv.id,
          paymentNumber: `PAY-401${i}`,
          bookingId: b.id, customerId: b.customerId,
          amount: totalAmount - advance, paymentType: "Balance",
          paymentMode: "Cash", paymentDate: new Date().toISOString().split("T")[0],
          status: "Completed", createdBy: adminUserId
        });
        await Receipt.create({
          tenantId: tenant.id, environmentId: prodEnv.id,
          receiptNumber: `REC-401${i}`,
          paymentId: p2.id, bookingId: b.id, customerId: b.customerId,
          receiptDate: new Date().toISOString().split("T")[0], amount: totalAmount - advance, status: "Generated", createdBy: adminUserId
        });
      }

      // Jobs (30 out of 45 bookings have active jobs)
      if (i < 30) {
        const job = await Job.create({
          tenantId: tenant.id, environmentId: prodEnv.id,
          bookingId: b.id, customerId: b.customerId,
          jobNumber: `JOB-300${i}`,
          eventDate: b.date, hall: b.hall,
          status: isPast ? "Completed" : "Planning",
          priority: "Normal",
          createdBy: adminUserId
        });
        await JobTimeline.create({
          tenantId: tenant.id, environmentId: prodEnv.id,
          jobId: job.id, action: "Job Created", details: "Auto generated from booking", userId: adminUserId
        });
        await JobStaff.create({
          tenantId: tenant.id, environmentId: prodEnv.id,
          jobId: job.id, userId: createdUsers[Math.floor(Math.random() * createdUsers.length)].id, role: "Event Manager", assignedBy: adminUserId
        });

        // Add 3 Checklists
        const tasks = ["Confirm Stage Decorator", "Check Audio System", "Finalize Catering Menu", "Arrange Valet Parking", "Clean Hall"];
        for (let j = 0; j < 3; j++) {
          const isCompleted = j === 0 || (isPast && j < 2);
          await JobChecklist.create({
            tenantId: tenant.id, environmentId: prodEnv.id,
            jobId: job.id,
            taskName: tasks[Math.floor(Math.random() * tasks.length)] + ` ${j}`,
            isCompleted: isCompleted,
            completedAt: isCompleted ? new Date().toISOString() : null,
            completedBy: isCompleted ? adminUserId : null,
            createdBy: adminUserId
          });
        }
      }
    }

    // Include today's events for the dashboard
    const today = new Date().toISOString().split("T")[0];
    const tb = await Booking.create({ tenantId: tenant.id, environmentId: prodEnv.id, bookingId: "BK-9001", customerId: customers[110].id, customerName: customers[110].name, phone: customers[110].phone, eventType: "Wedding", hall: "Emerald Hall", date: today, session: "Morning", guests: 800, advance: 50000, totalAmount: 180000, status: "Confirmed", createdBy: salesUserId });
    const tb2 = await Booking.create({ tenantId: tenant.id, environmentId: prodEnv.id, bookingId: "BK-9002", customerId: customers[111].id, customerName: customers[111].name, phone: customers[111].phone, eventType: "Corporate", hall: "Royal Hall", date: today, session: "Full Day", guests: 300, advance: 20000, totalAmount: 80000, status: "Confirmed", createdBy: salesUserId });
    
    // Expenses (40)
    for (let i = 1; i <= 40; i++) {
      await Expense.create({
        tenantId: tenant.id, environmentId: prodEnv.id,
        category: i % 3 === 0 ? "Maintenance" : (i % 2 === 0 ? "Utilities" : "Staff Salaries"),
        description: `Demo Expense ${i}`,
        amount: Math.floor(1000 + Math.random() * 9000),
        date: rDateStr(new Date(2026, 4, 1), new Date(2026, 7, 31)),
        recurring: i % 5 === 0,
        createdBy: adminUserId
      });
    }

    console.log("✅ Demo Seed Complete!");
    console.log("   Owner: owner@venue.com / owner123");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
