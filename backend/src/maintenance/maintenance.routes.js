// Express router for all bus maintenance endpoints
const express = require("express");
const router = express.Router();

// Import maintenance controller functions
const maintenanceController = require("./maintenance.controller");

// Import authentication middleware
const { protect, requireRole } = require("../auth/auth.middleware");

/**
 * Create a new maintenance ticket
 * Requires: Authentication
 * Body: { busId, issue, priority }
 */
router.post("/", protect, maintenanceController.createTicket);

/**
 * Get all maintenance tickets
 * Requires: Authentication
 */
router.get("/", protect, maintenanceController.getTickets);

router.put(
  "/:id/status",
  protect,
  requireRole("MECHANIC"),
  maintenanceController.updateTicketStatus,
);

router.put(
  "/:id/details",
  protect,
  requireRole("MECHANIC"),
  maintenanceController.updateTicketDetails,
);

/**
 * Mark a maintenance ticket as resolved
 * Requires: ADMIN authentication
 * Params: id - Ticket ID
 * Body: { resolution, resolutionDate }
 */
router.put(
  "/:id/resolve",
  protect,
  requireRole("MECHANIC"),
  maintenanceController.resolveTicket,
);

// Export router for use in app.js
module.exports = router;
