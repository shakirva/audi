const { Booking, Settings } = require("./models");
const sequelize = require("./db");

async function updatePrefixes() {
  await sequelize.sync();
  
  // Find all settings
  const settingsList = await Settings.findAll();
  
  for (const settings of settingsList) {
    if (!settings.bookingPrefix || settings.bookingPrefix === "BK") continue;
    
    const prefix = settings.bookingPrefix;
    console.log(`Updating bookings for Tenant ${settings.tenantId} to prefix ${prefix}...`);
    
    // Get all bookings for this tenant
    const bookings = await Booking.findAll({
      where: { tenantId: settings.tenantId, environmentId: settings.environmentId }
    });
    
    for (const booking of bookings) {
      if (booking.bookingId && booking.bookingId.startsWith("BK")) {
        const oldId = booking.bookingId;
        const newId = oldId.replace("BK", prefix);
        
        booking.bookingId = newId;
        await booking.save();
        console.log(`Updated ${oldId} -> ${newId}`);
      }
    }
  }
  
  console.log("Done.");
  process.exit(0);
}

updatePrefixes().catch(console.error);
