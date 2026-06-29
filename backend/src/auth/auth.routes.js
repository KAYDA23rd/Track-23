/**
 * Auth Routes
 * All authentication and user management endpoints
 */

const express = require("express");
const router = express.Router();

// Import authentication controller functions
const authController = require("./auth.controller");

// Import authentication middleware
const protect = require("../middleware/protect");

// Import validation schemas
const {
  validate,
  registerSchema,
  loginSchema,
} = require("../utils/validation");

/**
 * Register new user (Admin, Mechanic, Supervisor)
 * Requires: SUPER_ADMIN authentication
 * POST /auth/register
 */
router.post(
  "/register",
  protect,
  validate(registerSchema),
  authController.register,
);

/**
 * User login endpoint - public endpoint
 * POST /auth/login
 */
router.post("/login", validate(loginSchema), authController.login);

/**
 * Get current session/user info
 * GET /auth/session
 */
router.get("/session", protect, authController.getSession);

/**
 * Driver self-signup endpoint
 * POST /auth/driver/signup
 */
router.post("/driver/signup", authController.driverSignup);

/**
 * Mechanic self-signup endpoint
 * POST /auth/mechanic/signup
 */
router.post("/mechanic/signup", authController.mechanicSignup);

/**
 * Supervisor self-signup endpoint
 * POST /auth/supervisor/signup
 */
router.post("/supervisor/signup", authController.supervisorSignup);

/**
 * Get pending user approvals
 * GET /auth/pending-approvals?role=DRIVER
 */
router.get("/pending-approvals", protect, authController.getPendingApprovals);

/**
 * Approve a pending user account
 * POST /auth/approve/:userId
 */
router.post("/approve/:userId", protect, authController.approveAccount);

/**
 * Get user accounts by role
 * GET /auth/accounts?role=DRIVER
 */
router.get("/accounts", protect, authController.getAccountsByRole);

/**
 * Deactivate a user account
 * POST /auth/deactivate/:userId
 */
router.post("/deactivate/:userId", protect, authController.deactivateAccount);

module.exports = router;
