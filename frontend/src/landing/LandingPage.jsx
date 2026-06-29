// Public landing page for Track23.
// Introduces the company, provides role-based entry points,
// and adapts actions based on the current logged-in user.
import { Link } from "react-router-dom";
import "../styles/landing.css";
import { clearSession, decodeRole } from "../utils/authSession";

const decodeRoleFromToken = () => {
  return decodeRole();
};

function PortalLink({ children, className, to }) {
  return (
    <Link className={className} rel="noreferrer" target="_blank" to={to}>
      {children}
    </Link>
  );
}

export default function LandingPage() {
  const role = decodeRoleFromToken();
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isDriver = role === "DRIVER";
  const isMechanic = role === "MECHANIC";
  const isSupervisor = role === "SUPERVISOR";
  const roleLabel =
    role === "SUPER_ADMIN"
      ? "Super admin"
      : role === "ADMIN"
        ? "Admin"
        : role === "SUPERVISOR"
          ? "Supervisor"
          : role === "MECHANIC"
            ? "Mechanic"
            : role === "DRIVER"
              ? "Driver"
              : "User";

  const logout = () => {
    clearSession();
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
              <PortalLink className="landing-btn landing-btn-primary" to="/login">
                Enter as Admin
              </PortalLink>
            ) : isAdmin ? (
              <PortalLink className="landing-btn landing-btn-primary" to="/dashboard">
                Open Admin Console
              </PortalLink>
            ) : (
              <span className="landing-role-note">{roleLabel} account detected</span>
            )}
          </article>

          <article className="landing-role-card">
            <h3>Driver Portal</h3>
            <p>Use live navigation, stay tracked in real-time, submit remittances, and report issues.</p>
            {!role ? (
              <PortalLink className="landing-btn landing-btn-secondary" to="/driver/login">
                Enter as Driver
              </PortalLink>
            ) : isDriver ? (
              <PortalLink className="landing-btn landing-btn-secondary" to="/driver/app">
                Open Driver Console
              </PortalLink>
            ) : (
              <span className="landing-role-note">{roleLabel} account detected</span>
            )}
          </article>

          <article className="landing-role-card">
            <h3>Mechanic Portal</h3>
            <p>Take maintenance jobs, move buses through repair, and return vehicles to service readiness.</p>
            {!role ? (
              <PortalLink className="landing-btn landing-btn-secondary" to="/mechanic/login">
                Enter as Mechanic
              </PortalLink>
            ) : isMechanic || isAdmin ? (
              <PortalLink className="landing-btn landing-btn-secondary" to="/mechanic/app">
                Open Mechanic Console
              </PortalLink>
            ) : (
              <span className="landing-role-note">{roleLabel} account detected</span>
            )}
          </article>

          <article className="landing-role-card">
            <h3>Supervisor Portal</h3>
            <p>Run the control tower, escalate live incidents, and coordinate route, workshop, and remittance response.</p>
            {!role ? (
              <PortalLink className="landing-btn landing-btn-secondary" to="/supervisor/login">
                Enter as Supervisor
              </PortalLink>
            ) : isSupervisor || isAdmin ? (
              <PortalLink className="landing-btn landing-btn-secondary" to="/supervisor/app">
                Open Supervisor Console
              </PortalLink>
            ) : (
              <span className="landing-role-note">{roleLabel} account detected</span>
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

