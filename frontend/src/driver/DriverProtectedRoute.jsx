// Role guard for the driver mobile app.
// Keeps only driver accounts inside the driver console and
// continuously validates the active session.
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/api";
import { decodeRole, getToken } from "../utils/authSession";

export default function DriverProtectedRoute({ children }) {
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
    return <Navigate replace to="/driver/login" />;
  }

  const role = decodeRole(token);

  if (role !== "DRIVER") {
    return <Navigate replace to="/driver/login" />;
  }

  return children;
}

