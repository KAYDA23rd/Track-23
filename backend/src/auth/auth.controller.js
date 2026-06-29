/**
 * Auth Controller
 * HTTP request handlers for authentication endpoints
 * Uses auth.service for business logic
 */

const { asyncHandler } = require("../utils/errorHandler");
const authService = require("./auth.service");
const { getPrismaClient } = require("../config/database");
const logger = require("../utils/logger");

const prisma = getPrismaClient();

/**
 * Register a new user (Admin, Supervisor, Mechanic)
 * POST /auth/register
 */
exports.register = asyncHandler(async (req, res) => {
  logger.info(`Registering new user with role: ${req.validated.role}`);
  const user = await authService.registerUser(req.validated);
  res.status(201).json({
    message: "User created successfully",
    user,
  });
});

/**
 * Driver self-signup
 * POST /auth/driver/signup
 */
exports.driverSignup = asyncHandler(async (req, res) => {
  logger.info(`Driver signup: ${req.validated.phone}`);
  const result = await authService.driverSignup(req.validated);
  res.status(201).json(result);
});

/**
 * Mechanic self-signup
 * POST /auth/mechanic/signup
 */
exports.mechanicSignup = asyncHandler(async (req, res) => {
  logger.info(`Mechanic signup: ${req.validated.phone}`);
  const result = await authService.signupByRole(req.validated, "MECHANIC");
  res.status(201).json(result);
});

/**
 * Supervisor self-signup
 * POST /auth/supervisor/signup
 */
exports.supervisorSignup = asyncHandler(async (req, res) => {
  logger.info(`Supervisor signup: ${req.validated.phone}`);
  const result = await authService.signupByRole(req.validated, "SUPERVISOR");
  res.status(201).json(result);
});

/**
 * User login
 * POST /auth/login
 */
exports.login = asyncHandler(async (req, res) => {
  logger.info(`Login attempt: ${req.validated.phone}`);
  const result = await authService.login(req.validated);
  res.json({
    message: "Login successful",
    ...result,
  });
});

/**
 * Get current session/user info
 * GET /auth/session
 * Requires valid JWT token
 */
exports.getSession = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    logger.warn(`Session requested for non-existent user: ${req.user.id}`);
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "User not found",
        statusCode: 404,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  res.json({ user });
});

/**
 * Get pending user approvals
 * GET /auth/pending-approvals?role=DRIVER
 * Admin/SuperAdmin only
 */
exports.getPendingApprovals = asyncHandler(async (req, res) => {
  const { role } = req.query;
  logger.info(`Fetching pending approvals for role: ${role || "all"}`);
  const pendingUsers = await authService.getPendingApprovals(role);
  res.json(pendingUsers);
});

/**
 * Approve a pending user account
 * POST /auth/approve/:userId
 * Admin/SuperAdmin only
 */
exports.approveAccount = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  logger.info(`Approving account: ${userId}`);
  const user = await authService.approveAccount(userId);
  res.json({
    message: "Account approved successfully",
    user,
  });
});

/**
 * Get all user accounts by role
 * GET /auth/accounts?role=DRIVER
 */
exports.getAccountsByRole = asyncHandler(async (req, res) => {
  const { role } = req.query;

  if (!role) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Role query parameter is required",
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  logger.info(`Fetching ${role} accounts`);
  const users = await prisma.user.findMany({
    where: { role },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      isActive: true,
      approvedAt: true,
      createdAt: true,
    },
  });

  res.json(users);
});

/**
 * Deactivate a user account
 * POST /auth/deactivate/:userId
 * SuperAdmin only
 */
exports.deactivateAccount = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  logger.info(`Deactivating account: ${userId}`);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
    select: {
      id: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  res.json({
    message: "Account deactivated successfully",
    user,
  });
});
