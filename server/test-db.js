const sequelize = require("./db");
const Booking = require("./models/Booking");
async function test() {
  const bookings = await Booking.findAll();
  console.log(bookings.length);
  process.exit();
}
test();
