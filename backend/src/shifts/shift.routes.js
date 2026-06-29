// Express router for all shift scheduling endpoints
const express = require("express");
const router = express.Router();

// Import shift controller functions
const shiftController = require("./shift.controller");

// Import authentication middleware
const { protect, requireRole } = require("../auth/auth.middleware");

/**
 * Create a new shift assignment
 * Requires: ADMIN authentication
 * Validates no double-booking of drivers or buses
 * Body: { busId, driverId, startTime, endTime }
 */
router.post("/", protect, requireRole("ADMIN"), shiftController.createShift);

/**
 * Get all shifts with driver and bus details
 * Requires: Authentication
 */
router.get("/", protect, shiftController.getShifts);

/**
 * Update an existing shift
 * Requires: ADMIN authentication
 * Params: id - Shift ID
 * Body: { busId, driverId, startTime, endTime }
 */
router.put("/:id", protect, requireRole("ADMIN"), shiftController.updateShift);
router.put("/:id/confirm", protect, requireRole("ADMIN"), shiftController.confirmShift);
router.put("/:id/start", protect, requireRole("ADMIN"), shiftController.startShift);
router.put("/:id/complete", protect, requireRole("ADMIN"), shiftController.completeShift);
router.put("/:id/close", protect, requireRole("ADMIN"), shiftController.closeShift);
router.put("/:id/performance", protect, requireRole("DRIVER"), shiftController.updateShiftPerformance);

/**
 * Delete a shift
 * Requires: ADMIN authentication
 * Params: id - Shift ID
 */
router.delete(
  "/:id",
  protect,
  requireRole("ADMIN"),
  shiftController.deleteShift,
);

module.exports = router;
