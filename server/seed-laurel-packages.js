require('dotenv').config();
const Settings = require('./models/Settings');
const sequelize = require('./db');

const seed = async () => {
  try {
    await sequelize.authenticate();
    
    const settings = await Settings.findOne();
    if (!settings) return;

    const platinumSlabs = [
        { guests: 300, totalAmount: 390000, baseAmount: 190000, perPerson: 667 },
        { guests: 500, totalAmount: 490000, baseAmount: 190000, perPerson: 600 },
        { guests: 750, totalAmount: 550000, baseAmount: 190000, perPerson: 534 },
        { guests: 1000, totalAmount: 690000, baseAmount: 190000, perPerson: 510 },
        { guests: 1250, totalAmount: 790000, baseAmount: 190000, perPerson: 480 },
        { guests: 1500, totalAmount: 890000, baseAmount: 190000, perPerson: 467 },
        { guests: 1750, totalAmount: 990000, baseAmount: 190000, perPerson: 458 },
        { guests: 2000, totalAmount: 1050000, baseAmount: 190000, perPerson: 430 },
        { guests: 3500, totalAmount: 1650000, baseAmount: 190000, perPerson: 400 },
    ];

    const halls = [
      {
        name: "Platinum AC Package",
        icon: "🏛️",
        pricingType: "slab",
        price: 0,
        capacity: 3500,
        description: "Full Package - 5 Hours (A/C Auditorium + Food)",
        slabs: platinumSlabs
      },
      {
        name: "Economy Package",
        icon: "🏠",
        pricingType: "slab",
        price: 0,
        capacity: 1000,
        description: "Standard Auditorium Package without Food",
        slabs: []
      },
      {
        name: "Get-Together Package",
        icon: "✨",
        pricingType: "slab",
        price: 0,
        capacity: 500,
        description: "Intimate gathering setup",
        slabs: []
      },
      {
        name: "Pool Party Package",
        icon: "🏊",
        pricingType: "slab",
        price: 0,
        capacity: 200,
        description: "Outdoor pool side event",
        slabs: []
      }
    ];

    settings.halls = halls;
    await settings.save();
    console.log("Seeded all 4 packages!");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
seed();
