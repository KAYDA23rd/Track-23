// Mechanic login and self-signup screen.
// Supports workshop account creation with admin approval
// before workshop access is granted.
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/mechanic.css";
import { decodeRole, getToken, setToken } from "../utils/authSession";

export default function MechanicLogin() {
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
  if (existingRole === "MECHANIC") {
    return <Navigate replace to="/mechanic/app" />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const res = await api.post("/auth/login", { phone, password });
      const role = res.data?.user?.role;

      if (role !== "MECHANIC" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
        setError("This portal is for mechanic operations.");
        return;
      }

      setToken(res.data.token);
      navigate("/mechanic/app");
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
      await api.post("/auth/mechanic-signup", {
        name,
        phone,
        email,
        password,
      });

      setNotice("Mechanic account created. Admin approval is required before login.");
      setMode("login");
      setPassword("");
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to create mechanic account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mechanic-shell">
      <div className="mechanic-login-card">
        <Link className="mechanic-login-kicker" to="/">
          Track23 Mechanic Portal
        </Link>
        <h1>Mechanic Sign In</h1>
        <p className="mechanic-login-note">
          {mode === "login"
            ? "Review maintenance tickets, take vehicles into service, and return buses to roadworthy status."
            : "Create a mechanic account. Admin approval is required before first login."}
        </p>

        <div className="mechanic-mode-switch">
          <button
            className={`mechanic-mode-btn ${mode === "login" ? "is-active" : ""}`}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={`mechanic-mode-btn ${mode === "signup" ? "is-active" : ""}`}
            onClick={() => setMode("signup")}
            type="button"
          >
            Create Account
          </button>
        </div>

        {error ? <p className="mechanic-login-error">{error}</p> : null}
        {notice ? <p className="mechanic-login-notice">{notice}</p> : null}

        {mode === "login" ? (
          <form className="mechanic-login-form" onSubmit={handleLogin}>
            <input
              className="mechanic-input"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              required
              value={phone}
            />

            <input
              className="mechanic-input"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              type="password"
              value={password}
            />

            <button className="mechanic-btn mechanic-btn-primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="mechanic-login-form" onSubmit={handleSignup}>
            <input
              className="mechanic-input"
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              value={name}
            />

            <input
              className="mechanic-input"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              required
              value={phone}
            />

            <input
              className="mechanic-input"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional)"
              type="email"
              value={email}
            />

            <input
              className="mechanic-input"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password"
              required
              type="password"
              value={password}
            />

            <button className="mechanic-btn mechanic-btn-primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Submitting..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

