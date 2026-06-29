// Admin login screen.
// Restricts this portal to admin-level roles and routes
// successful sessions into the management console.
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import "../styles/login.css";
import { setToken } from "../utils/authSession";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", { phone, password });
      const role = res.data?.user?.role;
      if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        setError(
          role === "MECHANIC"
            ? "Use the Mechanic Portal for mechanic accounts."
            : "Use the Driver Portal for driver accounts.",
        );
        return;
      }
      setToken(res.data.token);
      window.location.href = "/dashboard";
    } catch {
      setError("Invalid login details");
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <Link className="login-kicker" to="/">
          Track 23
        </Link>
        <h2>Admin Login</h2>
        <p className="login-note">Sign in to access fleet operations and reporting.</p>

        <form className="login-form" onSubmit={handleLogin}>
          {error && <p className="login-error">{error}</p>}

          <input
            className="login-field"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <input
            className="login-field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="login-btn" type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

