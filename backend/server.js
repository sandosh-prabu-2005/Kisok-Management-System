// backend/server.js
require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const path = require("path");

// Import routes
const productsRouter = require("./routes/products");
const usersRouter = require("./routes/users");
const salesRouter = require("./routes/sales");
const recommendationsRouter = require("./routes/recommendations");
const feedbackRouter = require("./routes/feedback");

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:5001",
];

// Middleware
app.use((req, res, next) => {
  console.log("--- Incoming Request ---");
  console.log("URL:", req.originalUrl);
  console.log("Method:", req.method);
  console.log("Headers:", req.headers);
  next();
});
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        connectSrc: [
          "'self'",
          "http://localhost:5000",
          "http://localhost:5001",
        ],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);
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
const mongoURI = process.env.MONGO_URI;

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 20000,
  })
  .then(() => console.log("✓ MongoDB connected"))
  .catch((err) => {
    console.error("✗ MongoDB connection error:", err.message);
    if (err.reason) console.error("Reason:", err.reason);
  });

// Health check endpoint
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// API Route handlers
app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);
app.use("/api/sales", salesRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/feedback", feedbackRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});
