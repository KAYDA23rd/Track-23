const express = require("express");
const router = express.Router();

const remittanceController = require("./remittance.controller");
const { protect, requireRole } = require("../auth/auth.middleware");

// Driver/Admin submit remittance
router.post("/", protect, remittanceController.createRemittance);

// Admin approves
router.put(
  "/:id/approve",
  protect,
  requireRole("ADMIN"),
  remittanceController.approveRemittance
);

// View all
router.get("/", protect, remittanceController.getRemittances);

module.exports = router;
