const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// Get all products
router.get("/", async (req, res) => {
  console.log("/api/products endpoint hit");
  const headerSize = JSON.stringify(req.headers).length;
  if (req.headers.cookie) {
    console.error("Cookie header present:", req.headers.cookie.length, "bytes");
    console.error("Cookie header value:", req.headers.cookie);
  }
  if (headerSize > 8000) {
    console.error("Request headers too large:", headerSize, "bytes");
    return res.status(431).json({ error: "Request Header Fields Too Large" });
  }
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Error fetching products" });
  }
});

// Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Error fetching product" });
  }
});

// Update product quantity
router.post("/update-quantity", async (req, res) => {
  const { id, quantityChange } = req.body;
  try {
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    product.quantity += quantityChange;
    await product.save();
    res.json({ message: "Quantity updated", newQuantity: product.quantity });
  } catch (err) {
    res.status(500).json({ error: "Error updating quantity" });
  }
});

module.exports = router;
