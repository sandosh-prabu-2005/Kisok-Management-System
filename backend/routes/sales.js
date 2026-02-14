const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");
const User = require("../models/User");

// Record a sale (checkout)
router.post("/", async (req, res) => {
  console.log("/api/sales POST body:", req.body);
  try {
    // Validate required fields
    if (
      !req.body.userId ||
      !Array.isArray(req.body.items) ||
      typeof req.body.total !== "number"
    ) {
      console.error("Missing required fields in /api/sales");
      return res
        .status(400)
        .json({ error: "Missing required fields (userId, items, total)" });
    }
    const user = await User.findOne({ admissionNumber: req.body.userId });
    if (!user) {
      console.error("User not found for admissionNumber:", req.body.userId);
      return res.status(404).json({ error: "User not found" });
    }
    const sale = new Sale({
      ...req.body,
      order_id: `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    });
    await sale.save();
    // Update user's wallet balance by admission number
    user.wallet_balance -= req.body.total;
    await user.save();
    res.json({ message: "Sale recorded successfully" });
  } catch (err) {
    console.error("Error recording sale:", err);
    res
      .status(500)
      .json({ error: "Error recording sale", details: err.message });
  }
});

// Get all sales
router.get("/", async (req, res) => {
  try {
    const sales = await Sale.find();
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: "Error fetching sales" });
  }
});

module.exports = router;
