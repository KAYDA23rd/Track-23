// JWT library for token verification
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Role hierarchy: Higher numbers = more permissions
 * Used to determine if a user has sufficient access level for a given endpoint
 */
const ROLE_RANK = {
  DRIVER: 1,
  MECHANIC: 2,
  SUPERVISOR: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

/**
 * Check if a user's role meets or exceeds required role level
 * Example: ADMIN (rank 4) can access DRIVER endpoints (rank 1)
 * @param {string} userRole - The user's assigned role
 * @param {string} requiredRole - The minimum role required for access
 * @returns {boolean} True if user has sufficient access level
 */
const hasRequiredRole = (userRole, requiredRole) => {
  const userRank = ROLE_RANK[userRole] || 0;
  const requiredRank = ROLE_RANK[requiredRole] || 0;
  return userRank >= requiredRank;
};

/**
 * Middleware: Verify JWT token from Authorization header
 * Adds authenticated user info to req.user
 */
exports.protect = async (req, res, next) => {
  // Extract Authorization header
  const authHeader = req.headers.authorization;

  // Check if Bearer token is present
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authorized" });
  }

  // Extract token from "Bearer <token>" format
  const token = authHeader.split(" ")[1];

  try {
    // Verify token signature and decode
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Account not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account inactive" });
    }

    // Attach user data to request
    req.user = {
      ...decoded,
      role: user.role,
    };

    // Continue to next middleware/controller
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

/**
 * Middleware: Check if authenticated user has required role
 * Must be used AFTER protect middleware
 * @param {string} role - Minimum required role level
 * @returns {function} Express middleware function
 */
exports.requireRole = (role) => {
  return (req, res, next) => {
    // Compare user's role rank against required role rank
    if (!hasRequiredRole(req.user.role, role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    // User has sufficient permissions, continue
    next();
  };
};
