const express = require("express");
const router = express.Router();

const reportController = require("./report.controller");
const { protect, requireRole } = require("../auth/auth.middleware");

// ADMIN ONLY REPORTS
router.get("/daily-revenue", protect, requireRole("ADMIN"), reportController.dailyRevenue);
router.get("/revenue-by-route", protect, requireRole("ADMIN"), reportController.revenueByRoute);
router.get("/driver-performance", protect, requireRole("ADMIN"), reportController.driverPerformance);
router.get("/maintenance-summary", protect, requireRole("ADMIN"), reportController.maintenanceSummary);

module.exports = router;
