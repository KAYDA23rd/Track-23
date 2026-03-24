import { Navigate } from "react-router-dom";

const decodeRole = (token) => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const parsed = JSON.parse(atob(payload));
    return parsed.role || null;
  } catch {
    return null;
  }
};

export default function ProtectedRoute({ children, allowedRoles = ["ADMIN", "SUPER_ADMIN"] }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const role = decodeRole(token);
  if (!allowedRoles.includes(role)) {
    return <Navigate to={role === "DRIVER" ? "/driver/app" : "/login"} replace />;
  }

  return children;
}
