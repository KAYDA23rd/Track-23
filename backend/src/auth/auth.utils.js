/**
 * Authentication utilities
 * JWT generation and other auth helpers
 */

const jwt = require("jsonwebtoken");
const { AUTH_CONFIG } = require("../utils/constants");

/**
 * Generate JWT token for authenticated user
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: AUTH_CONFIG.JWT_EXPIRY,
  });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
};
