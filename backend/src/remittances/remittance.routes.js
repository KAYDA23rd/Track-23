const express = require("express");
const router = express.Router();

const remittanceController = require("./remittance.controller");
const { protect, requireRole } = require("../auth/auth.middleware");

// Driver/Admin submit remittance
router.post("/", protect, remittanceController.createRemittance);

// View expected amount
router.get("/expected-amount", protect, remittanceController.getExpectedAmount);

// Super Admin updates expected amount
router.put(
  "/expected-amount",
  protect,
  requireRole("SUPER_ADMIN"),
  remittanceController.updateExpectedAmount
);

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
