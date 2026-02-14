const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  admissionNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  department: { type: String },
  wallet_balance: { type: Number, default: 0 },
  password: { type: String },
  role: { type: String, default: "user" },
  email: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
