const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const { protect, requireRole } = require("./auth.middleware");

router.post("/register", protect, requireRole("SUPER_ADMIN"), authController.register);
router.post("/login", authController.login);
router.post("/driver-signup", authController.driverSignup);
router.post("/create-admin", protect, requireRole("SUPER_ADMIN"), authController.createAdmin);
router.get("/drivers/pending", protect, requireRole("ADMIN"), authController.getPendingDrivers);
router.put("/drivers/:id/approve", protect, requireRole("ADMIN"), authController.approveDriver);

module.exports = router;
