require('dotenv').config();
const Settings = require('./models/Settings');
const sequelize = require('./db');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.");

    const settings = await Settings.findOne();
    if (!settings) {
      console.log("No settings found in DB.");
      return;
    }

    const laurelGardenHall = {
      name: "Laurel Garden (Platinum 5 Hours)",
      icon: "🏛️",
      pricingType: "slab",
      price: 0,
      pricePerPax: 0,
      capacity: 3500,
      description: "A/C Auditorium Including all amenities with Food",
      slabs: [
        { guests: 300, totalAmount: 390000, baseAmount: 190000, perPerson: 667 },
        { guests: 500, totalAmount: 490000, baseAmount: 190000, perPerson: 600 },
        { guests: 750, totalAmount: 550000, baseAmount: 190000, perPerson: 534 },
        { guests: 1000, totalAmount: 690000, baseAmount: 190000, perPerson: 510 },
        { guests: 1250, totalAmount: 790000, baseAmount: 190000, perPerson: 480 },
        { guests: 1500, totalAmount: 890000, baseAmount: 190000, perPerson: 467 },
        { guests: 1750, totalAmount: 990000, baseAmount: 190000, perPerson: 458 },
        { guests: 2000, totalAmount: 1050000, baseAmount: 190000, perPerson: 430 },
        { guests: 3500, totalAmount: 1650000, baseAmount: 190000, perPerson: 400 },
      ]
    };

    settings.halls = [laurelGardenHall];
    settings.venueName = "Laurel Garden";
    await settings.save();
    
    console.log("Successfully seeded Laurel Garden data!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
};

seed();
