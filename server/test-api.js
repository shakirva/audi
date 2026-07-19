const axios = require('axios');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 1, email: 'owner@venueza.com', role: 'Owner' }, 'hallmaster_jwt_secret_key_2026_secure');

async function test() {
  try {
    const { data } = await axios.get('http://localhost:5005/api/bookings', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Bookings fetched:", data.length);
    if(data.length > 0) console.log("First booking:", data[0]);
  } catch (err) {
    console.error("Error:", err.message, err.response?.data);
  }
}
test();
