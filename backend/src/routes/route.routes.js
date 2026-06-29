// Express router for all route management endpoints
const express = require("express");
const router = express.Router();

// Import route controller functions
const {
  createRoute,
  getRoutes,
  updateRoute,
  deleteRoute,
} = require("./route.controller");

// Import JWT middleware for authentication
const protect = require("../middleware/protect");

/**
 * Create a new route with start/end coordinates
 * Requires: Authentication
 * Body: { name, startPoint, endPoint, startLat, startLng, endLat, endLng }
 */
router.post("/", protect, createRoute);

/**
 * Get all routes
 * Requires: Authentication
 */
router.get("/", protect, getRoutes);

/**
 * Update route information
 * Requires: Authentication
 * Params: id - Route ID
 * Body: { name, startPoint, endPoint, startLat, startLng, endLat, endLng }
 */
router.put("/:id", protect, updateRoute);

/**
 * Delete a route
 * Requires: Authentication
 * Params: id - Route ID
 */
router.delete("/:id", protect, deleteRoute);

// Export router for use in app.js
module.exports = router;
