// JWT library for token verification
const jwt = require("jsonwebtoken");
const { unauthorizedError } = require("../utils/errorHandler");

/**
 * Middleware: Extract and verify JWT token from Authorization header
 * Adds decoded user info to req.user for downstream route handlers
 * Any route using this middleware requires a valid Bearer token
 */
module.exports = (req, res, next) => {
  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization;

    // Check for missing or malformed Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw unauthorizedError("Missing or invalid authorization header");
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.split(" ")[1];

    // Verify token signature and decode user data
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded user data (id, role) to request object for use in controllers
    req.user = decoded; // { id, role }

    // Continue to next middleware/route handler
    next();
  } catch (err) {
    // Return 401 if token is invalid, expired, or tampered with.
    throw unauthorizedError(err.message || "Invalid or expired token");
  }
};
