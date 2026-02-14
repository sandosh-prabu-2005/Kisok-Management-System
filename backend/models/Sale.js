const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String },
  items: { type: Array, required: true },
  total: { type: Number, required: true },
  timestamp: { type: Number },
  order_id: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Sale", SaleSchema);
