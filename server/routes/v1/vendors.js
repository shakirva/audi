const express = require("express");
const router = express.Router();
const { Vendor } = require("../../models");
const { auth } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { planGate } = require("../../middleware/planGate");

router.use(auth, tenantScope, subscriptionGuard, planGate);

// GET /api/v1/vendors
router.get("/", async (req, res) => {
  try {
    const vendors = await Vendor.findAll({
      where: { tenantId: req.tenantId, environmentId: req.environmentId },
      order: [["name", "ASC"]],
    });
    // Add default fields expected by the frontend
    const formatted = vendors.map(v => ({
      ...v.toJSON(),
      location: v.address,
      rating: 5.0,
      jobs: 0,
      totalBilled: 0,
      totalPaid: 0
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Fetch vendors error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch vendors" });
  }
});

// POST /api/v1/vendors
router.post("/", async (req, res) => {
  try {
    const { name, category, phone, location, email, tags } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ success: false, error: "Name and category are required" });
    }

    const newVendor = await Vendor.create({
      tenantId: req.tenantId,
      environmentId: req.environmentId,
      name,
      category,
      phone,
      address: location,
      email,
      tags: tags || [],
      status: "Active"
    });

    const formatted = {
      ...newVendor.toJSON(),
      location: newVendor.address,
      rating: 5.0,
      jobs: 0,
      totalBilled: 0,
      totalPaid: 0
    };

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Create vendor error:", error);
    res.status(500).json({ success: false, error: "Failed to create vendor" });
  }
});

// PUT /api/v1/vendors/:id
router.put("/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      where: { id: req.params.id, tenantId: req.tenantId, environmentId: req.environmentId }
    });

    if (!vendor) {
      return res.status(404).json({ success: false, error: "Vendor not found" });
    }

    const { name, category, phone, location, email, tags } = req.body;

    await vendor.update({
      name: name || vendor.name,
      category: category || vendor.category,
      phone: phone || vendor.phone,
      address: location || vendor.address,
      email: email || vendor.email,
      tags: tags || vendor.tags
    });

    const formatted = {
      ...vendor.toJSON(),
      location: vendor.address,
      rating: 5.0,
      jobs: 0,
      totalBilled: 0,
      totalPaid: 0
    };

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Update vendor error:", error);
    res.status(500).json({ success: false, error: "Failed to update vendor" });
  }
});

// DELETE /api/v1/vendors/:id
router.delete("/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      where: { id: req.params.id, tenantId: req.tenantId, environmentId: req.environmentId }
    });

    if (!vendor) {
      return res.status(404).json({ success: false, error: "Vendor not found" });
    }

    await vendor.destroy();
    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    console.error("Delete vendor error:", error);
    res.status(500).json({ success: false, error: "Failed to delete vendor" });
  }
});

module.exports = router;
