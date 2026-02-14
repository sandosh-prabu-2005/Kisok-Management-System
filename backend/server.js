// backend/server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const axios = require("axios");

// Serve static files for the React app at /sandosh-prabu-2005
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use((req, res, next) => {
  console.log("--- Incoming Request ---");
  console.log("URL:", req.originalUrl);
  console.log("Method:", req.method);
  console.log("Headers:", req.headers);
  next();
});
app.use(helmet());
app.use(cors({ origin: "http://localhost:3000" })); // Removed credentials:true, no cookies needed
app.use(bodyParser.json());
app.use(
  "/sandosh-prabu-2005",
  express.static(path.join(__dirname, "../build"))
);

// For any route under /sandosh-prabu-2005, serve index.html (for React Router)
app.get("/sandosh-prabu-2005/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../build", "index.html"));
});

// MongoDB connection
const mongoURI =
  process.env.MONGO_URI;

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 20000,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    if (err.reason) console.error("Reason:", err.reason);
  });

// Schemas
const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  quantity: Number,
  description: String,
  image: String,
});
const UserSchema = new mongoose.Schema({
  admissionNumber: String,
  name: String,
  department: String,
  wallet_balance: Number,
  password: String,
  role: String,
  email: String,
});
const SaleSchema = new mongoose.Schema({
  userId: String,
  userEmail: String,
  items: Array,
  total: Number,
  timestamp: Number,
  order_id: { type: String, unique: true, sparse: true },
});
const FeedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  admissionNumber: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", ProductSchema);
const User = mongoose.model("User", UserSchema);
const Sale = mongoose.model("Sale", SaleSchema);
const Feedback = mongoose.model("Feedback", FeedbackSchema);

// Health check endpoint
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// API Endpoints
app.get("/api/products", async (req, res) => {
  console.log("/api/products endpoint hit");
  const headerSize = JSON.stringify(req.headers).length;
  if (req.headers.cookie) {
    console.error("Cookie header present:", req.headers.cookie.length, "bytes");
    console.error("Cookie header value:", req.headers.cookie);
  }
  if (headerSize > 8000) {
    // 8KB is a common limit
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

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Error fetching product" });
  }
});

app.post("/api/products/update-quantity", async (req, res) => {
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

app.get("/api/users", async (req, res) => {
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

app.post("/api/users", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json({ message: "User added successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error adding user" });
  }
});

// Record a sale (checkout)
app.post("/api/sales", async (req, res) => {
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

app.get("/api/sales", async (req, res) => {
  try {
    const sales = await Sale.find();
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: "Error fetching sales" });
  }
});

// AI-powered recommendations endpoint
app.get("/api/recommendations", async (req, res) => {
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
    // 4. Call Gemini API
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

    // 5. Merge and deduplicate
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

// Feedback submission endpoint
app.post("/api/feedback", async (req, res) => {
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

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
