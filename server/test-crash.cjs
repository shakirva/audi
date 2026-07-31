require('dotenv').config();
const express = require("express");
const app = express();
app.use(express.json());

// Mock middleware
app.use((req, res, next) => {
  req.user = { id: 1, role: 'Owner' };
  req.tenantId = 1;
  req.environmentId = 1;
  next();
});

const enquiryController = require("./controllers/enquiry.controller");
app.post("/test", enquiryController.create);

app.use((err, req, res, next) => {
  console.error("EXPRESS ERROR:", err);
  res.status(500).json({ error: err.message });
});

const db = require("./models");
db.sequelize.sync().then(() => {
  const server = app.listen(5006, async () => {
    try {
      const axios = require('axios');
      const res = await axios.post('http://localhost:5006/test', {
        enquirerName: "shana",
        enquirerPhone: "08086645733",
        eventType: "Wedding",
        tentativeDate: "2026-12-20",
        session: "Morning",
        hallPreference: "BANQUET HALL",
        guestCount: 996,
        budget: 150000,
        leadScore: "Hot",
        status: "New Enquiry",
        salesExecutiveId: null // Wait, salesExecutiveId is not required right?
      });
      console.log("Success:", res.data);
    } catch (err) {
      console.error("Axios Error:", err.response ? err.response.data : err.message);
    } finally {
      server.close();
      process.exit();
    }
  });
});
