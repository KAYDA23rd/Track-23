const jwt = require("jsonwebtoken");

const ROLE_RANK = {
  DRIVER: 1,
  MECHANIC: 2,
  SUPERVISOR: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

const hasRequiredRole = (userRole, requiredRole) => {
  const userRank = ROLE_RANK[userRole] || 0;
  const requiredRank = ROLE_RANK[requiredRole] || 0;
  return userRank >= requiredRank;
};

exports.protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

exports.requireRole = (role) => {
  return (req, res, next) => {
    if (!hasRequiredRole(req.user.role, role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};
