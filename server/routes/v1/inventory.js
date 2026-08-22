const express = require("express");
const router = express.Router();
const { Inventory } = require("../../models");
const { auth } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");

// GET /api/v1/inventory
router.get("/", auth, tenantScope, async (req, res) => {
  try {
    const items = await Inventory.findAll({
      where: { tenantId: req.tenantId, environmentId: req.environmentId },
      order: [["itemName", "ASC"]],
    });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error("Fetch inventory error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch inventory items" });
  }
});

// POST /api/v1/inventory
router.post("/", auth, tenantScope, async (req, res) => {
  try {
    const { itemName, category, totalQuantity, availableQuantity, condition, notes, unitPrice } = req.body;
    
    if (!itemName) {
      return res.status(400).json({ success: false, error: "Item name is required" });
    }

    const newItem = await Inventory.create({
      tenantId: req.tenantId,
      environmentId: req.environmentId,
      itemName,
      category,
      totalQuantity: totalQuantity || 0,
      availableQuantity: availableQuantity !== undefined ? availableQuantity : (totalQuantity || 0),
      condition: condition || "Good",
      notes,
      unitPrice,
      createdBy: req.user.id
    });

    res.json({ success: true, data: newItem });
  } catch (error) {
    console.error("Create inventory error:", error);
    res.status(500).json({ success: false, error: "Failed to create inventory item" });
  }
});

// PUT /api/v1/inventory/:id
router.put("/:id", auth, tenantScope, async (req, res) => {
  try {
    const item = await Inventory.findOne({
      where: { id: req.params.id, tenantId: req.tenantId, environmentId: req.environmentId }
    });

    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    await item.update({
      ...req.body,
      updatedBy: req.user.id
    });

    res.json({ success: true, data: item });
  } catch (error) {
    console.error("Update inventory error:", error);
    res.status(500).json({ success: false, error: "Failed to update inventory item" });
  }
});

// DELETE /api/v1/inventory/:id
router.delete("/:id", auth, tenantScope, async (req, res) => {
  try {
    const item = await Inventory.findOne({
      where: { id: req.params.id, tenantId: req.tenantId, environmentId: req.environmentId }
    });

    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    await item.destroy();
    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    console.error("Delete inventory error:", error);
    res.status(500).json({ success: false, error: "Failed to delete inventory item" });
  }
});

module.exports = router;
