const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const expenseRoutes = require("./routes/expenseRoutes");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let dbPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing");
  }

  if (!dbPromise) {
    dbPromise = mongoose.connect(
      process.env.MONGO_URI
    );
  }

  try {
    await dbPromise;
  } catch (error) {
    dbPromise = null;
    throw error;
  }
}

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Spendly API is running",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await connectDB();

    res.status(200).json({
      success: true,
      message: "Spendly backend is healthy",
      database: "connected",
    });
  } catch (error) {
    console.error(
      "Health check failed:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.use(
  "/api/expenses",
  expenseRoutes
);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

module.exports = app;
