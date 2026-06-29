// Express router for all driver management endpoints
const express = require("express");
const router = express.Router();

// Import driver controller functions
const {
  createDriver,
  getDrivers,
  updateDriver,
  deleteDriver,
} = require("./driver.controller");

// Import JWT middleware for authentication
const protect = require("../middleware/protect");

/**
 * Create a new driver profile
 * Requires: Authentication
 * Body: { name, phone, licenseNo }
 */
router.post("/", protect, createDriver);

/**
 * Get all drivers
 * Requires: Authentication
 */
router.get("/", protect, getDrivers);

/**
 * Update driver information
 * Requires: Authentication
 * Params: id - Driver ID
 * Body: { name, phone, licenseNo }
 */
router.put("/:id", protect, updateDriver);

// Export router for use in app.js
module.exports = router;
router.delete("/:id", protect, deleteDriver);

module.exports = router;
