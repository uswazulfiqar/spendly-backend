const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const expenseRoutes = require("./routes/expenseRoutes");
const authRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");

const app = express();

// ------------------------------
// CORS
// ------------------------------
const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://spendly-blond-six.vercel.app",
]);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no Origin (Postman, server-to-server, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Allow local frontend
      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      // Allow Vercel preview/production frontend URLs
      if (
        origin.startsWith("https://spendly-") &&
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);

// ------------------------------
// Middleware
// ------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------------
// MongoDB connection
// ------------------------------
let dbPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing");
  }

  if (!dbPromise) {
    dbPromise = mongoose.connect(process.env.MONGO_URI);
  }

  try {
    await dbPromise;
  } catch (error) {
    dbPromise = null;
    throw error;
  }
}

// ------------------------------
// Basic test route
// ------------------------------
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Spendly API is running",
  });
});

// ------------------------------
// Health check
// ------------------------------
app.get("/api/health", async (req, res) => {
  try {
    await connectDB();

    res.status(200).json({
      success: true,
      message: "Spendly backend is healthy",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// ------------------------------
// Connect MongoDB before API routes
// ------------------------------
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// ------------------------------
// API routes
// ------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/workspaces", workspaceRoutes);

// ------------------------------
// 404
// ------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// ------------------------------
// Error handler
// ------------------------------
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  if (error.message === "CORS origin not allowed") {
    return res.status(403).json({
      success: false,
      message: "CORS origin not allowed",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

module.exports = app;