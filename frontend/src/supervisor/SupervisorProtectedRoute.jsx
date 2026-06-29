// Role guard for the supervisor app.
// Allows supervisor and admin-level users into the control
// tower while checking session validity in the background.
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/api";
import { decodeRole, getToken } from "../utils/authSession";

export default function SupervisorProtectedRoute({
  children,
  allowedRoles = ["SUPERVISOR", "ADMIN", "SUPER_ADMIN"],
}) {
  const token = getToken();

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
  }, [token]);

  if (!token) {
    return <Navigate replace to="/supervisor/login" />;
  }

  const role = decodeRole(token);

  if (!allowedRoles.includes(role)) {
    return <Navigate replace to="/supervisor/login" />;
  }

  return children;
}

