// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();

// connect to MongoDB
connectDB();

const app = express();

// CORS: allow frontend URL from env, fallback to localhost for dev
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// JSON body parsing
app.use(express.json());

// Logging (optional: only in development)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Health check (useful for deployment)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Root info
app.get("/", (req, res) => {
  res.send("Clean-Up Tracker API is running");
});

// API routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/stats", require("./routes/statsRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
