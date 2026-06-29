// Express router for all bus/fleet management endpoints
const express = require("express");
const router = express.Router();

// Import bus controller functions
const {
  createBus,
  getBuses,
  updateBus,
  deleteBus,
} = require("./bus.controller");

// Import JWT middleware for authentication
const protect = require("../middleware/protect");

/**
 * Create a new bus
 * Requires: Authentication
 * Body: { plateNumber, model, routeId }
 */
router.post("/", protect, createBus);

/**
 * Get all buses with their route information
 * Requires: Authentication
 */
router.get("/", protect, getBuses);

/**
 * Update bus information
 * Requires: Authentication
 * Params: id - Bus ID
 * Body: { plateNumber, model, routeId, status }
 */
router.put("/:id", protect, updateBus);

/**
 * Delete a bus
 * Requires: Authentication
 * Params: id - Bus ID
 */
router.delete("/:id", protect, deleteBus);

// Export router for use in app.js
module.exports = router;
router.delete("/:id", protect, deleteBus);

// Any logged-in user
router.get("/", protect, getBuses);

module.exports = router;
