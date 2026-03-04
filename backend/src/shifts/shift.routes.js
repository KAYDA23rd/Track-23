const express = require("express");
const router = express.Router();

const shiftController = require("./shift.controller");
const { protect, requireRole } = require("../auth/auth.middleware");

// ADMIN only
router.post("/", protect, requireRole("ADMIN"), shiftController.createShift);
router.put("/:id", protect, requireRole("ADMIN"), shiftController.updateShift);
router.delete(
  "/:id",
  protect,
  requireRole("ADMIN"),
  shiftController.deleteShift,
);

// Any logged-in user
router.get("/", protect, shiftController.getShifts);

module.exports = router;
