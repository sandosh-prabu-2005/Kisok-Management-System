const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  admissionNumber: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Feedback", FeedbackSchema);
