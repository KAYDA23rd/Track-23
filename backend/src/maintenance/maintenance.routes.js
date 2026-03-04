const express = require("express");
const router = express.Router();

const maintenanceController = require("./maintenance.controller");
const { protect, requireRole } = require("../auth/auth.middleware");

router.post("/", protect, maintenanceController.createTicket);
router.put(
  "/:id/resolve",
  protect,
  requireRole("ADMIN"),
  maintenanceController.resolveTicket
);
router.get("/", protect, maintenanceController.getTickets);

module.exports = router;
