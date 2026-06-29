// Express router for real-time driver location tracking endpoints
const express = require("express");

// Import authentication middleware
const { protect, requireRole } = require("../auth/auth.middleware");

// Import tracking controller functions
const trackingController = require("./tracking.controller");

// Create router
const router = express.Router();

/**
 * Update/create driver's current location
 * Requires: DRIVER authentication
 * Body: { lat, lng, speedKph, heading, accuracyM }
 * Returns: location data and assigned busId
 */
router.post(
  "/location",
  protect,
  requireRole("DRIVER"),
  trackingController.upsertDriverLocation,
);

/**
 * Get live locations of all drivers
 * Requires: ADMIN authentication
 * Returns: All driver locations updated in the last 15 minutes
 */
router.get(
  "/live",
  protect,
  requireRole("SUPERVISOR"),
  trackingController.getLiveDriverLocations,
);

// Export router for use in app.js
module.exports = router;
