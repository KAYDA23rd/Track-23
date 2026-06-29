// Express router for all reporting and analytics endpoints
const express = require("express");
const router = express.Router();

// Import report controller functions
const reportController = require("./report.controller");

// Import authentication middleware
const { protect, requireRole } = require("../auth/auth.middleware");

/**
 * Get daily revenue report
 * Requires: ADMIN authentication
 * Shows total revenue by date
 */
router.get(
  "/daily-revenue",
  protect,
  requireRole("SUPERVISOR"),
  reportController.dailyRevenue,
);

/**
 * Get revenue breakdown by route
 * Requires: ADMIN authentication
 * Shows which routes generate most revenue
 */
router.get(
  "/revenue-by-route",
  protect,
  requireRole("SUPERVISOR"),
  reportController.revenueByRoute,
);

/**
 * Get driver performance metrics
 * Requires: ADMIN authentication
 * Shows ratings and statistics for each driver
 */
router.get(
  "/driver-performance",
  protect,
  requireRole("SUPERVISOR"),
  reportController.driverPerformance,
);

/**
 * Get maintenance summary
 * Requires: ADMIN authentication
 * Shows open/closed maintenance tickets by bus
 */
router.get(
  "/maintenance-summary",
  protect,
  requireRole("SUPERVISOR"),
  reportController.maintenanceSummary,
);

router.get(
  "/operations-console",
  protect,
  requireRole("SUPERVISOR"),
  reportController.operationsConsole,
);

router.get(
  "/alert-center",
  protect,
  requireRole("SUPERVISOR"),
  reportController.alertCenter,
);

// Export router for use in app.js
module.exports = router;
