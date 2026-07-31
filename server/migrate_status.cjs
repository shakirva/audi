require("dotenv").config({ path: "./server/.env" });
const sequelize = require("./server/db");
const { Enquiry } = require("./server/models");

async function migrate() {
  try {
    const [updated] = await Enquiry.update(
      { status: "Interested" },
      { where: { status: "Quotation Sent" } }
    );
    console.log(`Migrated ${updated} enquiries.`);
    
    // Also run a raw query to alter the enum if it's MySQL
    await sequelize.query(`
      ALTER TABLE Enquiries 
      MODIFY COLUMN status ENUM('New Enquiry', 'Contacted', 'Follow-up', 'Customer Visit', 'Interested', 'Booking Confirmed', 'Cancelled', 'Lost') DEFAULT 'New Enquiry'
    `).catch(e => console.log("Alter enum error (safe to ignore if sqlite):", e.message));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
migrate();
