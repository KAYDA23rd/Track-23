// Supervisor control-tower app.
// Surfaces the live alert center, corridor watchlist,
// workshop blockers, and dispatch exceptions.
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/supervisor.css";
import { clearSession } from "../utils/authSession";

const severityOrder = ["critical", "high", "medium", "low"];

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

export default function SupervisorApp() {
  const [operations, setOperations] = useState(null);
  const [alertCenter, setAlertCenter] = useState(null);
  const [liveLocations, setLiveLocations] = useState([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState([]);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [opsRes, alertsRes, trackingRes, maintenanceRes] = await Promise.all([
        api.get("/reports/operations-console"),
        api.get("/reports/alert-center"),
        api.get("/tracking/live"),
        api.get("/maintenance"),
      ]);

      setOperations(opsRes.data);
      setAlertCenter(alertsRes.data);
      setLiveLocations(trackingRes.data || []);
      setMaintenanceTickets(maintenanceRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const intervalId = window.setInterval(loadData, 15000);
    return () => window.clearInterval(intervalId);
  }, []);

  const visibleAlerts = useMemo(() => {
    const alerts = alertCenter?.alerts || [];
    if (severityFilter === "all") return alerts;
    return alerts.filter((alert) => alert.severity === severityFilter);
  }, [alertCenter, severityFilter]);

  const activeTickets = useMemo(
    () => maintenanceTickets.filter((ticket) => ticket.status !== "RESOLVED"),
    [maintenanceTickets],
  );

  const routeWatchlist = useMemo(
    () =>
      [...(operations?.routePerformance || [])]
        .sort((a, b) => (b.reportedRevenue || 0) - (a.reportedRevenue || 0))
        .slice(0, 4),
    [operations],
  );

  const logout = () => {
    clearSession();
    navigate("/supervisor/login");
  };

  return (
    <div className="supervisor-shell">
      <div className="supervisor-app">
        <header className="supervisor-topbar">
          <div>
            <Link className="supervisor-login-kicker" to="/">
              Track23 Supervisor
            </Link>
            <h1>Control Tower</h1>
            <p>Run corridor exceptions in real time across dispatch, remittance, tracking, and workshop readiness.</p>
          </div>

          <div className="supervisor-top-actions">
            <span className="supervisor-status">Live Monitoring</span>
            <button className="supervisor-btn supervisor-btn-ghost" onClick={logout} type="button">
              Log out
            </button>
          </div>
        </header>

        <section className="supervisor-summary-grid">
          <article className="supervisor-card">
            <span>Open Alerts</span>
            <strong>{alertCenter?.alertCount ?? 0}</strong>
          </article>
          <article className="supervisor-card">
            <span>Critical Alerts</span>
            <strong>{alertCenter?.severityCounts?.critical ?? 0}</strong>
          </article>
          <article className="supervisor-card">
            <span>Live Shifts</span>
            <strong>{operations?.liveShifts ?? 0}</strong>
          </article>
          <article className="supervisor-card">
            <span>Tracked Drivers</span>
            <strong>{liveLocations.length}</strong>
          </article>
        </section>

        <section className="supervisor-grid">
          <article className="supervisor-panel supervisor-panel-primary">
            <div className="supervisor-panel-head">
              <div>
                <h2>Alert Center</h2>
                <p>Critical operating exceptions sorted by severity and freshness.</p>
              </div>

              <div className="supervisor-filter-row">
                <button
                  className={`supervisor-filter ${severityFilter === "all" ? "is-active" : ""}`}
                  onClick={() => setSeverityFilter("all")}
                  type="button"
                >
                  All
                </button>
                {severityOrder.map((severity) => (
                  <button
                    className={`supervisor-filter ${severityFilter === severity ? "is-active" : ""}`}
                    key={severity}
                    onClick={() => setSeverityFilter(severity)}
                    type="button"
                  >
                    {severity}
                  </button>
                ))}
              </div>
            </div>

            <div className="supervisor-alert-list">
              {visibleAlerts.map((alert) => (
                <article className="supervisor-alert-card" key={alert.id}>
                  <div className="supervisor-alert-head">
                    <span className={`supervisor-badge supervisor-badge-${alert.severity}`}>
                      {alert.severity}
                    </span>
                    <small>{formatDateTime(alert.timestamp)}</small>
                  </div>
                  <h3>{alert.title}</h3>
                  <p>{alert.message}</p>
                  <div className="supervisor-alert-meta">
                    <span>Route: {alert.route || "-"}</span>
                    <span>Subject: {alert.subject || "-"}</span>
                    <span>Type: {alert.type}</span>
                  </div>
                </article>
              ))}

              {!loading && visibleAlerts.length === 0 ? (
                <p className="supervisor-empty">No alerts in this queue.</p>
              ) : null}
            </div>
          </article>

          <article className="supervisor-panel">
            <div className="supervisor-panel-head">
              <div>
                <h2>Operations Snapshot</h2>
                <p>Control-room view of dispatch risk and current service posture.</p>
              </div>
            </div>

            <div className="supervisor-kpi-stack">
              <div className="supervisor-kpi">
                <span>Pending handover</span>
                <strong>{operations?.pendingHandover ?? 0}</strong>
              </div>
              <div className="supervisor-kpi">
                <span>Overdue shifts</span>
                <strong>{operations?.overdueShifts ?? 0}</strong>
              </div>
              <div className="supervisor-kpi">
                <span>Pending remittances</span>
                <strong>{operations?.pendingRemittances ?? 0}</strong>
              </div>
              <div className="supervisor-kpi">
                <span>Escalated remittances</span>
                <strong>{operations?.escalatedRemittances ?? 0}</strong>
              </div>
              <div className="supervisor-kpi">
                <span>Workshop blockers</span>
                <strong>{operations?.unresolvedMaintenance ?? 0}</strong>
              </div>
              <div className="supervisor-kpi">
                <span>Completed awaiting close</span>
                <strong>{operations?.completedAwaitingClose ?? 0}</strong>
              </div>
            </div>
          </article>
        </section>

        <section className="supervisor-grid">
          <article className="supervisor-panel">
            <div className="supervisor-panel-head">
              <div>
                <h2>Live Corridor Watch</h2>
                <p>Drivers currently on the road with last-known telemetry.</p>
              </div>
            </div>

            <div className="supervisor-table-wrap">
              <table className="supervisor-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Bus</th>
                    <th>Route</th>
                    <th>Speed</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {liveLocations.map((item) => (
                    <tr key={item.id}>
                      <td>{item.user?.name || "-"}</td>
                      <td>{item.bus?.plateNumber || item.busId || "-"}</td>
                      <td>{item.bus?.route?.name || "-"}</td>
                      <td>{item.speedKph ? `${Math.round(item.speedKph)} km/h` : "-"}</td>
                      <td>{formatDateTime(item.recordedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && liveLocations.length === 0 ? (
              <p className="supervisor-empty">No live driver locations available.</p>
            ) : null}
          </article>

          <article className="supervisor-panel">
            <div className="supervisor-panel-head">
              <div>
                <h2>Workshop Blockers</h2>
                <p>Active faults keeping buses away from dispatch.</p>
              </div>
            </div>

            <div className="supervisor-ticket-list">
              {activeTickets.map((ticket) => (
                <article className="supervisor-ticket-card" key={ticket.id}>
                  <div className="supervisor-ticket-head">
                    <div>
                      <h3>{ticket.bus?.plateNumber || "Bus"}</h3>
                      <p>{ticket.bus?.route?.name || "No route assigned"}</p>
                    </div>
                    <span className={`supervisor-badge supervisor-badge-${ticket.status === "OPEN" ? "high" : "medium"}`}>
                      {ticket.status}
                    </span>
                  </div>

                  <p className="supervisor-ticket-issue">{ticket.issue}</p>
                  <div className="supervisor-ticket-meta">
                    <span>Assigned: {ticket.assignedMechanicName || "Unassigned"}</span>
                    <span>Priority: {ticket.workshopPriority ?? "-"}</span>
                    <span>Raised: {formatDateTime(ticket.createdAt)}</span>
                  </div>
                </article>
              ))}

              {!loading && activeTickets.length === 0 ? (
                <p className="supervisor-empty">No workshop blockers right now.</p>
              ) : null}
            </div>
          </article>
        </section>

        <section className="supervisor-grid">
          <article className="supervisor-panel">
            <div className="supervisor-panel-head">
              <div>
                <h2>Live Operations Board</h2>
                <p>Trips in motion with passenger and trip progress.</p>
              </div>
            </div>

            <div className="supervisor-ops-list">
              {(operations?.liveOperations || []).map((item) => (
                <article className="supervisor-ops-card" key={item.shiftId}>
                  <div className="supervisor-ops-head">
                    <div>
                      <h3>{item.bus}</h3>
                      <p>{item.route}</p>
                    </div>
                    <span className="supervisor-badge supervisor-badge-low">
                      {item.remittanceSubmitted ? "Remitted" : "On Route"}
                    </span>
                  </div>
                  <div className="supervisor-ops-meta">
                    <span>Driver: {item.driver}</span>
                    <span>Trips: {item.completedTrips}</span>
                    <span>Passengers: {item.passengerCount}</span>
                    <span>Started: {formatDateTime(item.startedAt)}</span>
                  </div>
                </article>
              ))}

              {!loading && (operations?.liveOperations || []).length === 0 ? (
                <p className="supervisor-empty">No buses are currently on route.</p>
              ) : null}
            </div>
          </article>

          <article className="supervisor-panel">
            <div className="supervisor-panel-head">
              <div>
                <h2>Route Watchlist</h2>
                <p>Corridor productivity and revenue watch for today.</p>
              </div>
            </div>

            <div className="supervisor-watchlist">
              {routeWatchlist.map((route) => (
                <article className="supervisor-watch-card" key={route.routeId}>
                  <div className="supervisor-watch-head">
                    <h3>{route.routeName}</h3>
                    <span>{route.activeBuses} active buses</span>
                  </div>
                  <div className="supervisor-watch-metrics">
                    <span>Trips: {route.totalTrips}</span>
                    <span>Passengers: {route.totalPassengers}</span>
                    <span>Revenue/trip: NGN {route.revenuePerTrip.toLocaleString()}</span>
                    <span>
                      Duration: {route.avgDurationMinutes ? `${route.avgDurationMinutes} mins` : "-"}
                    </span>
                  </div>
                </article>
              ))}

              {!loading && routeWatchlist.length === 0 ? (
                <p className="supervisor-empty">No route performance data yet for today.</p>
              ) : null}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

