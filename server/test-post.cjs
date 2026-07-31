const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5005/api/v1/enquiries', {
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
      headers: {
        'Authorization': 'Bearer DUMMY_TOKEN', // Wait, auth requires a real token locally!
        'X-Environment': 'production'
      }
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
