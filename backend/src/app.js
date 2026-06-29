// Core Express dependencies
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Import error handling utilities
const { errorHandler } = require("./utils/errorHandler");

// Import all route modules for different business domains
const authRoutes = require("./auth/auth.routes");
const routeRoutes = require("./routes/route.routes");
const busRoutes = require("./buses/bus.routes");
const driverRoutes = require("./drivers/driver.routes");
const shiftRoutes = require("./shifts/shift.routes");
const remittanceRoutes = require("./remittances/remittance.routes");
const maintenanceRoutes = require("./maintenance/maintenance.routes");
const reportRoutes = require("./reports/report.routes");
const trackingRoutes = require("./tracking/tracking.routes");

// Create Express application instance
const app = express();

// Security: Add HTTP security headers with helmet
app.use(helmet());

// Security: Configure CORS with origin whitelist
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:5173"];

app.use(
  cors({
    origin: corsOrigins,
    credentials: process.env.CORS_CREDENTIALS === "true",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Security: Limit request payload size
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Security: Rate limiting middleware
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/auth", limiter); // Stricter rate limiting for auth endpoints
app.use("/", (req, res, next) => {
  if (!req.path.startsWith("/auth")) {
    return limiter(req, res, next);
  }
  next();
});

// Mount authentication endpoints (/auth)
console.log("✅ Mounting /auth routes");
app.use("/auth", authRoutes);

// Mount route management endpoints (/routes)
console.log("✅ Mounting /routes routes");
app.use("/routes", routeRoutes);

// Mount bus/fleet management endpoints (/buses)
console.log("✅ Mounting /buses routes");
app.use("/buses", busRoutes);

// Mount driver management endpoints (/drivers)
console.log("✅ Mounting /drivers routes");
app.use("/drivers", driverRoutes);

// Mount shift scheduling endpoints (/shifts)
console.log("✅ Mounting /shifts routes");
app.use("/shifts", shiftRoutes);

// Mount financial remittance endpoints (/remittances)
console.log("✅ Mounting /remittances routes");
app.use("/remittances", remittanceRoutes);

// Mount bus maintenance endpoints (/maintenance)
console.log("✅ Mounting /maintenance routes");
app.use("/maintenance", maintenanceRoutes);

// Mount reporting endpoints (/reports)
console.log("✅ Mounting /reports routes");
app.use("/reports", reportRoutes);

// Mount real-time driver tracking endpoints (/tracking)
console.log("✅ Mounting /tracking routes");
app.use("/tracking", trackingRoutes);

// Health check endpoint - confirms API is running
app.get("/", (req, res) => {
  res.json({
    status: "running",
    service: "Track23 Backend",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler - must be before error handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
      timestamp: new Date().toISOString(),
    },
  });
});

// Centralized error handling middleware (must be last)
app.use(errorHandler);

// Export the configured Express app for server.js to use
module.exports = app;
