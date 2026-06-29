// Driver login and self-signup screen.
// Supports driver onboarding with admin approval before
// the account can access the mobile driver console.
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/driver.css";
import { decodeRole, getToken, setDriverProfile, setToken } from "../utils/authSession";

export default function DriverLogin() {
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const existingToken = getToken();
  if (existingToken && decodeRole(existingToken) === "DRIVER") {
    return <Navigate replace to="/driver/app" />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const res = await api.post("/auth/login", { phone, password });

      if (res.data?.user?.role !== "DRIVER") {
        setError("This portal is for driver accounts only.");
        setIsSubmitting(false);
        return;
      }

      setToken(res.data.token);
      setDriverProfile({
        phone,
        name: res.data.user?.name || "Track23 Driver",
      });
      navigate("/driver/app");
    } catch (err) {
      const message = err?.response?.data?.error || "Invalid login details.";
      setError(message);
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
      await api.post("/auth/driver-signup", {
        name,
        phone,
        password,
        licenseNo,
      });

      setNotice("Account created. Admin approval is required before login.");
      setMode("login");
      setPassword("");
    } catch (err) {
      const message = err?.response?.data?.error || "Unable to create account right now.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="driver-shell">
      <div className="driver-login-card">
        <Link className="driver-login-kicker" to="/">
          Track23 Driver Portal
        </Link>
        <h1>{mode === "login" ? "Driver Sign In" : "Create Driver Account"}</h1>
        <p className="driver-login-note">
          {mode === "login"
            ? "Access shifts, submit remittance, and report issues."
            : "Create your account. An admin will activate it before first login."}
        </p>

        <div className="driver-mode-switch">
          <button
            className={`driver-mode-btn ${mode === "login" ? "is-active" : ""}`}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={`driver-mode-btn ${mode === "signup" ? "is-active" : ""}`}
            onClick={() => setMode("signup")}
            type="button"
          >
            Create Account
          </button>
        </div>

        {error && <p className="driver-login-error">{error}</p>}
        {notice && <p className="driver-login-notice">{notice}</p>}

        {mode === "login" ? (
          <form className="driver-login-form" onSubmit={handleLogin}>
            <input
              className="driver-input"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              required
              value={phone}
            />

            <input
              className="driver-input"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              type="password"
              value={password}
            />

            <button className="driver-btn driver-btn-primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="driver-login-form" onSubmit={handleSignup}>
            <input
              className="driver-input"
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              value={name}
            />

            <input
              className="driver-input"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              required
              value={phone}
            />

            <input
              className="driver-input"
              onChange={(e) => setLicenseNo(e.target.value)}
              placeholder="License number"
              required
              value={licenseNo}
            />

            <input
              className="driver-input"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password"
              required
              type="password"
              value={password}
            />

            <button className="driver-btn driver-btn-primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Submitting..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

