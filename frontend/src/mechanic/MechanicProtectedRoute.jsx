// Role guard for the mechanic app.
// Allows workshop staff and higher admin roles into the
// repair console while continuously validating sessions.
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/api";
import { decodeRole, getToken } from "../utils/authSession";

export default function MechanicProtectedRoute({
  children,
  allowedRoles = ["MECHANIC", "ADMIN", "SUPER_ADMIN"],
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
    return <Navigate replace to="/mechanic/login" />;
  }

  const role = decodeRole(token);

  if (!allowedRoles.includes(role)) {
    return <Navigate replace to="/mechanic/login" />;
  }

  return children;
}

