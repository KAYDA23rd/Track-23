const express = require("express");

const router = express.Router();
const remittanceController = require("./remittance.controller");
const { protect, requireRole } = require("../auth/auth.middleware");

router.post("/", protect, remittanceController.createRemittance);
router.get("/expected-amount", protect, remittanceController.getExpectedAmount);
router.get("/summary", protect, requireRole("SUPERVISOR"), remittanceController.getReconciliationSummary);

router.put(
  "/expected-amount",
  protect,
  requireRole("SUPER_ADMIN"),
  remittanceController.updateExpectedAmount,
);

router.get("/", protect, remittanceController.getRemittances);

router.put(
  "/:id/approve",
  protect,
  requireRole("ADMIN"),
  remittanceController.approveRemittance,
);

router.put(
  "/:id/review",
  protect,
  requireRole("ADMIN"),
  remittanceController.reviewRemittance,
);

module.exports = router;
