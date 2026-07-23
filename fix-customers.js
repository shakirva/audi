require("dotenv").config();
const sequelize = require('./server/db');
const Booking = require('./server/models/Booking');
const Customer = require('./server/models/Customer');

(async () => {
  try {
    const bookings = await Booking.findAll();
    let fixedCount = 0;
    
    for(const b of bookings) {
      if (!b.customerId && b.phone) {
        let cust = await Customer.findOne({ where: { phone: b.phone } });
        if (cust) {
          b.customerId = cust.id;
          await b.save();
          fixedCount++;
        }
      }
    }
    console.log("Fixed", fixedCount, "bookings.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
