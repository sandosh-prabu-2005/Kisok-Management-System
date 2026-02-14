const express = require("express");
const router = express.Router();
const axios = require("axios");
const Sale = require("../models/Sale");
const Product = require("../models/Product");

// AI-powered recommendations endpoint
router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId;
    const sales = await Sale.find();
    const products = await Product.find();

    // Trending logic (unchanged)
    const productCounts = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productCounts[item.id]) productCounts[item.id] = 0;
        productCounts[item.id] += item.quantity;
      });
    });
    const trending = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => products.find((p) => p._id == id || p.id == id))
      .filter(Boolean);

    // Collaborative: build user-item matrix
    const userPurchases = {};
    sales.forEach((sale) => {
      if (!userPurchases[sale.userId]) userPurchases[sale.userId] = [];
      sale.items.forEach((item) => {
        userPurchases[sale.userId].push(item.name);
      });
    });
    // Prepare prompt for Gemini
    let prompt = `Given the following user purchase history, suggest 5 products that are likely to be bought together (collaborative filtering, trending, and diversity):\n${JSON.stringify(
      userPurchases
    )}\nProduct catalog: ${products.map((p) => p.name).join(", ")}\n`;
    if (userId && userPurchases[userId]) {
      prompt += `Focus on recommendations for user: ${userId} (who bought: ${userPurchases[
        userId
      ].join(", ")})\n`;
    }
    prompt +=
      'Return a JSON array of objects: [{"name":..., "reason":...}] where reason explains why each product is recommended.';
    // Call Gemini API
    let aiRecommendations = [];
    try {
      const geminiRes = await axios.post(
        "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=AIzaSyC6rQa2C11BLKOEajcBhYpIsRdZIemq8Vw",
        {
          contents: [{ parts: [{ text: prompt }] }],
        }
      );
      // Parse Gemini response
      const text =
        geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const match = text.match(/\[.*\]/s);
      if (match) {
        aiRecommendations = JSON.parse(match[0]);
      }
    } catch (err) {
      console.error("Gemini API error:", err.message);
    }
    // Map AI product names to product objects and attach reason
    const aiProducts = aiRecommendations
      .map((obj) => {
        const prod = products.find((p) => p.name === obj.name);
        return prod ? { ...prod.toObject(), reason: obj.reason } : null;
      })
      .filter(Boolean)
      .slice(0, 5);

    // Merge and deduplicate
    const all = [...trending, ...aiProducts].filter(
      (v, i, arr) =>
        v && arr.findIndex((p) => p._id.toString() === v._id.toString()) === i
    );
    res.json({ trending, ai: aiProducts, all });
  } catch (err) {
    console.error("Recommendation error:", err);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

module.exports = router;
