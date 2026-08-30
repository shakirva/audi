const express = require('express');
const router = express.Router();
const { DemoRequest } = require('../models');

// POST /api/public/leads
router.post('/leads', async (req, res, next) => {
  try {
    const { name, phone, venueName, city } = req.body;
    
    if (!name || !phone || !venueName || !city) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    const newRequest = await DemoRequest.create({
      name,
      phone,
      venueName,
      city
    });

    res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
