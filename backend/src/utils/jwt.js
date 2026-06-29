// JWT library for creating signed tokens
const jwt = require("jsonwebtoken");

/**
 * Generate JWT authentication token for a user
 * Token includes user ID and role, expires in 7 days
 * @param {Object} user - User object containing id and role
 * @returns {string} Signed JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

// Export function for use in auth controllers
module.exports = { generateToken };
