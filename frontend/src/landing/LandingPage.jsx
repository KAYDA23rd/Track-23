import { Link } from "react-router-dom";
import "../styles/landing.css";

const decodeRoleFromToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const [, payload] = token.split(".");
    if (!payload) return null;
    const parsed = JSON.parse(atob(payload));
    return parsed.role || null;
  } catch {
    return null;
  }
};

export default function LandingPage() {
  const role = decodeRoleFromToken();
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isDriver = role === "DRIVER";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("driver_phone");
    localStorage.removeItem("driver_name");
    window.location.href = "/";
  };

  return (
    <div className="landing-shell">
      <div className="landing-glow landing-glow-left" />
      <div className="landing-glow landing-glow-right" />

      <main className="landing-card">
        <header className="landing-topbar">
          <div>
            <p className="landing-kicker">Track 23</p>
            <h1>Lagos Commercial Mobility Infrastructure</h1>
          </div>
          <div className="landing-status-pill">Iyana-Iba ↔ Egbeda</div>
        </header>

        <p className="landing-subtitle">
          Structured fleet operations with monitored drivers, route intelligence, and transparent
          remittance control built for scale.
        </p>

        <section className="landing-role-grid">
          <article className="landing-role-card">
            <h3>Admin Portal</h3>
            <p>Monitor drivers, assign shifts, track remittances, and manage route performance.</p>
            {!role ? (
              <Link className="landing-btn landing-btn-primary" to="/login">
                Enter as Admin
              </Link>
            ) : isAdmin ? (
              <Link className="landing-btn landing-btn-primary" to="/dashboard">
                Open Admin Console
              </Link>
            ) : (
              <span className="landing-role-note">Driver account detected</span>
            )}
          </article>

          <article className="landing-role-card">
            <h3>Driver Portal</h3>
            <p>Use live navigation, stay tracked in real-time, submit remittances, and report issues.</p>
            {!role ? (
              <Link className="landing-btn landing-btn-secondary" to="/driver/login">
                Enter as Driver
              </Link>
            ) : isDriver ? (
              <Link className="landing-btn landing-btn-secondary" to="/driver/app">
                Open Driver Console
              </Link>
            ) : (
              <span className="landing-role-note">Admin account detected</span>
            )}
          </article>
        </section>

        <section className="landing-media-grid">
          <article className="landing-media-card">
            <img
              alt="Lagos korope fleet"
              src="/images/landing/lagos-korope-fleet.jpg"
            />
            <div className="landing-media-caption">
              <h4>Korope Fleet Operations</h4>
              <p>Structured korope deployment on fixed corridors with monitored dispatch.</p>
            </div>
          </article>
          <article className="landing-media-card">
            <img
              alt="Smart minibus interior"
              src="/images/landing/smart-minibus-interior.jpg"
            />
            <div className="landing-media-caption">
              <h4>Smart Driver Cabin</h4>
              <p>Technology-enabled interior for safer driving and better rider experience.</p>
            </div>
          </article>
        </section>

        <section className="landing-metrics">
          <div>
            <strong>24/7</strong>
            <span>Operational visibility</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>Mandatory driver tracking</span>
          </div>
          <div>
            <strong>NGN 25,000</strong>
            <span>Expected remittance baseline</span>
          </div>
        </section>

        {role ? (
          <div className="landing-actions">
            <button className="landing-btn landing-btn-secondary" onClick={logout} type="button">
              Log out
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
