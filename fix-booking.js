const { Booking } = require('./server/models');
const sequelize = require('./server/db');

async function fix() {
  await sequelize.sync();
  const b = await Booking.findOne({ where: { totalAmount: 104900 } });
  if (b) {
    console.log("Found booking:", b.id, "Taxes:", b.taxes);
    b.taxes = 13950;
    await b.save();
    console.log("Updated to 13950");
  } else {
    console.log("Not found");
  }
}
fix();
