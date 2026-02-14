const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find(
      {},
      "admissionNumber name department wallet_balance role email"
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Error fetching users" });
  }
});

// Create a new user
router.post("/", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json({ message: "User added successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error adding user" });
  }
});

module.exports = router;
