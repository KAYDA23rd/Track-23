// Express router for all authentication endpoints
const express = require("express");
const router = express.Router();

// Import authentication controller functions
const authController = require("./auth.controller");

// Import authentication middleware for protecting routes
const { protect, requireRole } = require("./auth.middleware");

/**
 * Register new user (Admin, Mechanic, etc.)
 * Requires: SUPER_ADMIN authentication
 * Body: { name, phone, email, password, role }
 */
router.post(
  "/register",
  protect,
  requireRole("SUPER_ADMIN"),
  authController.register,
);

/**
 * User login endpoint
 * Public endpoint - no authentication required
 * Body: { phone, password }
 * Returns: { token, user }
 */
router.post("/login", authController.login);
router.get("/session", protect, authController.getSession);

/**
 * Driver self-signup endpoint
 * Public endpoint - drivers can register themselves
 * Requires admin approval before account becomes active
 * Body: { name, phone, password, licenseNo, email }
 */
router.post("/driver-signup", authController.driverSignup);
router.post("/mechanic-signup", authController.mechanicSignup);
router.post("/supervisor-signup", authController.supervisorSignup);

/**
 * Create new admin account
 * Requires: SUPER_ADMIN authentication
 * Body: { name, phone, email, password }
 */
router.post(
  "/create-admin",
  protect,
  requireRole("SUPER_ADMIN"),
  authController.createAdmin,
);

/**
 * Get list of drivers pending approval
 * Requires: ADMIN authentication
 * Returns: Array of pending driver applications
 */
router.get(
  "/drivers/pending",
  protect,
  requireRole("ADMIN"),
  authController.getPendingDrivers,
);

router.get(
  "/drivers",
  protect,
  requireRole("ADMIN"),
  authController.getDriverAccounts,
);

router.get(
  "/staff/pending",
  protect,
  requireRole("ADMIN"),
  authController.getPendingStaff,
);

router.get(
  "/staff",
  protect,
  requireRole("ADMIN"),
  authController.getStaffAccounts,
);

/**
 * Approve a pending driver account
 * Requires: ADMIN authentication
 * Body: { id } - Driver user ID to approve
 */
router.put(
  "/drivers/:id/approve",
  protect,
  requireRole("ADMIN"),
  authController.approveDriver,
);

router.put(
  "/drivers/:id/status",
  protect,
  requireRole("ADMIN"),
  authController.setDriverStatus,
);

router.put(
  "/staff/:id/approve",
  protect,
  requireRole("ADMIN"),
  authController.approveStaff,
);

router.put(
  "/staff/:id/status",
  protect,
  requireRole("ADMIN"),
  authController.setStaffStatus,
);

// Export router for use in app.js
module.exports = router;
