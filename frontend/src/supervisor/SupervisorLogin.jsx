// Supervisor login and self-signup screen.
// Supports control-tower onboarding with admin approval
// before supervisors can access live operations.
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/supervisor.css";
import { decodeRole, getToken, setToken } from "../utils/authSession";

export default function SupervisorLogin() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const existingToken = getToken();
  const existingRole = existingToken ? decodeRole(existingToken) : null;
  if (existingRole === "SUPERVISOR" || existingRole === "ADMIN" || existingRole === "SUPER_ADMIN") {
    return <Navigate replace to="/supervisor/app" />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const res = await api.post("/auth/login", { phone, password });
      const role = res.data?.user?.role;

      if (!["SUPERVISOR", "ADMIN", "SUPER_ADMIN"].includes(role)) {
        setError("This portal is for supervisor operations.");
        return;
      }

      setToken(res.data.token);
      navigate("/supervisor/app");
    } catch (err) {
      setError(err?.response?.data?.error || "Invalid login details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      await api.post("/auth/supervisor-signup", {
        name,
        phone,
        email,
        password,
      });

      setNotice("Supervisor account created. Admin approval is required before login.");
      setMode("login");
      setPassword("");
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to create supervisor account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="supervisor-shell">
      <div className="supervisor-login-card">
        <Link className="supervisor-login-kicker" to="/">
          Track23 Supervisor Portal
        </Link>
        <h1>Supervisor Sign In</h1>
        <p className="supervisor-login-note">
          {mode === "login"
            ? "Monitor the corridor live, handle exceptions, and coordinate dispatch, remittance, and workshop response."
            : "Create a supervisor account. Admin approval is required before first login."}
        </p>

        <div className="supervisor-mode-switch">
          <button
            className={`supervisor-mode-btn ${mode === "login" ? "is-active" : ""}`}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={`supervisor-mode-btn ${mode === "signup" ? "is-active" : ""}`}
            onClick={() => setMode("signup")}
            type="button"
          >
            Create Account
          </button>
        </div>

        {error ? <p className="supervisor-login-error">{error}</p> : null}
        {notice ? <p className="supervisor-login-notice">{notice}</p> : null}

        {mode === "login" ? (
          <form className="supervisor-login-form" onSubmit={handleLogin}>
            <input
              className="supervisor-input"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              required
              value={phone}
            />
            <input
              className="supervisor-input"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              type="password"
              value={password}
            />

            <button className="supervisor-btn supervisor-btn-primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="supervisor-login-form" onSubmit={handleSignup}>
            <input
              className="supervisor-input"
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              value={name}
            />
            <input
              className="supervisor-input"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              required
              value={phone}
            />
            <input
              className="supervisor-input"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional)"
              type="email"
              value={email}
            />
            <input
              className="supervisor-input"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password"
              required
              type="password"
              value={password}
            />

            <button className="supervisor-btn supervisor-btn-primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Submitting..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

