const express = require("express");
const cors = require("cors");

const authRoutes = require("./auth/auth.routes");
const routeRoutes = require("./routes/route.routes");
const busRoutes = require("./buses/bus.routes");
const driverRoutes = require("./drivers/driver.routes");
const shiftRoutes = require("./shifts/shift.routes");
const remittanceRoutes = require("./remittances/remittance.routes");
const maintenanceRoutes = require("./maintenance/maintenance.routes");
const reportRoutes = require("./reports/report.routes");
const trackingRoutes = require("./tracking/tracking.routes");

const app = express();

app.use(cors());
app.use(express.json());

console.log("✅ Mounting /auth routes");
app.use("/auth", authRoutes);

console.log("✅ Mounting /routes routes");
app.use("/routes", routeRoutes);

console.log("✅ Mounting /buses routes");
app.use("/buses", busRoutes);

console.log("✅ Mounting /drivers routes");
app.use("/drivers", driverRoutes);

console.log("✅ Mounting /shifts routes");
app.use("/shifts", shiftRoutes);

console.log("✅ Mounting /remittances routes");
app.use("/remittances", remittanceRoutes);

console.log("✅ Mounting /maintenance routes");
app.use("/maintenance", maintenanceRoutes);

console.log("✅ Mounting /reports routes");
app.use("/reports", reportRoutes);

console.log("Mounting /tracking routes");
app.use("/tracking", trackingRoutes);

app.get("/", (req, res) => {
  res.send("Track23 backend is running 🚍");
});

module.exports = app;
