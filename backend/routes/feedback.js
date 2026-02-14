const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");

// Submit feedback
router.post("/", async (req, res) => {
  try {
    const { name, admissionNumber, message } = req.body;
    if (!name || !admissionNumber || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const feedback = new Feedback({ name, admissionNumber, message });
    await feedback.save();
    res.json({ message: "Feedback submitted successfully" });
  } catch (err) {
    console.error("Error saving feedback:", err);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

module.exports = router;
