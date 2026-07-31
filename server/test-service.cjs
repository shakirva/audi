const enquiryService = require("./services/enquiry.service");
const db = require("./models");

async function test() {
  try {
    const result = await enquiryService.createEnquiry({
      enquirerName: "shana",
      enquirerPhone: "08086645733",
      eventType: "Wedding",
      tentativeDate: "2026-12-20",
      session: "Morning",
      hallPreference: "BANQUET HALL",
      guestCount: 996,
      budget: 150000,
      leadScore: "Hot",
      status: "New Enquiry"
    }, {
      tenantId: 1, // Assuming tenant 1 exists locally
      environmentId: 1, // Assuming env 1 exists locally
      createdBy: 1
    });
    console.log("Success", result);
  } catch (err) {
    console.error("Error!!!", err);
  } finally {
    process.exit();
  }
}
test();
