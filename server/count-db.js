require("dotenv").config();
const sequelize = require("./db");
const { Customer, Enquiry, Booking, Agreement, Payment, Job, Expense, User } = require("./models");

async function checkCounts() {
  try {
    const customers = await Customer.count();
    const enquiries = await Enquiry.count();
    const bookings = await Booking.count();
    const agreements = await Agreement.count();
    const payments = await Payment.count();
    const jobs = await Job.count();
    const expenses = await Expense.count();
    const users = await User.count();
    
    console.log("--- DB COUNTS ---");
    console.log("Customers:", customers);
    console.log("Enquiries:", enquiries);
    console.log("Bookings:", bookings);
    console.log("Agreements:", agreements);
    console.log("Payments:", payments);
    console.log("Jobs:", jobs);
    console.log("Expenses:", expenses);
    console.log("Users (Staff):", users);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

checkCounts();
