// Role guard for admin-side screens.
// Verifies session validity and redirects non-admin roles
// into their correct operational app.
import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../api/api";
import { decodeRole, getToken } from "../utils/authSession";

export default function ProtectedRoute({
  children,
  allowedRoles = ["ADMIN", "SUPER_ADMIN"],
}) {
  const token = getToken();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return undefined;

    const checkSession = async () => {
      try {
        await api.get("/auth/session");
      } catch {
        // Redirect handled by interceptor.
      }
    };

    checkSession();
    const intervalId = window.setInterval(checkSession, 10000);
    return () => window.clearInterval(intervalId);
  }, [token, navigate]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const role = decodeRole(token);

  if (!allowedRoles.includes(role)) {
    return (
      <Navigate
        to={
          role === "DRIVER"
            ? "/driver/app"
            : role === "MECHANIC"
              ? "/mechanic/app"
              : role === "SUPERVISOR"
                ? "/supervisor/app"
              : "/login"
        }
        replace
      />
    );
  }

  return children;
}

