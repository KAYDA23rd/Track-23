// Core Express dependencies
const express = require("express");
const cors = require("cors");

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

// Enable Cross-Origin Resource Sharing (CORS) for frontend communication
app.use(cors());

// Middleware to parse incoming JSON request bodies
app.use(express.json());

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
console.log("Mounting /tracking routes");
app.use("/tracking", trackingRoutes);

// Health check endpoint - confirms API is running
app.get("/", (req, res) => {
  res.send("Track23 backend is running 🚍");
});

// Export the configured Express app for server.js to use
module.exports = app;
