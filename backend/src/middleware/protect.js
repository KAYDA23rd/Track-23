// JWT library for token verification
const jwt = require("jsonwebtoken");

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
      return res.status(401).json({ error: "Not authorized" });
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
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
