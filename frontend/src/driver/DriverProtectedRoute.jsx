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

export default function DriverProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate replace to="/driver/login" />;
  }

  const role = decodeRole(token);

  if (role !== "DRIVER") {
    localStorage.removeItem("token");
    localStorage.removeItem("driver_phone");
    localStorage.removeItem("driver_name");
    return <Navigate replace to="/driver/login" />;
  }

  return children;
}
