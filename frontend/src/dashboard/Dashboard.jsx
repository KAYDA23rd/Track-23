// Admin control-room dashboard.
// Shows operating KPIs, revenue posture, route performance,
// and the live corridor overview for Track23 management.
import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import FleetMap from "../components/FleetMap";
import "../styles/dashboard.css";

const formatMoney = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

export default function Dashboard() {
  const [revenue, setRevenue] = useState({ expected: 0, reported: 0 });
  const [consoleData, setConsoleData] = useState({
    liveShifts: 0,
    pendingHandover: 0,
    overdueShifts: 0,
    completedAwaitingClose: 0,
    pendingRemittances: 0,
    escalatedRemittances: 0,
    unresolvedMaintenance: 0,
    offlineDrivers: [],
    overdueShiftList: [],
    routePerformance: [],
    liveOperations: [],
    tripMetrics: {
      completedTrips: 0,
      passengerCount: 0,
      completedLoops: 0,
      avgPassengersPerTrip: 0,
      avgDurationMinutes: null,
    },
  });

  useEffect(() => {
    Promise.all([api.get("/reports/daily-revenue"), api.get("/reports/operations-console")])
      .then(([revenueRes, consoleRes]) => {
        setRevenue(revenueRes.data);
        setConsoleData(consoleRes.data);
      })
      .catch((err) => {
        console.error("Unable to load dashboard data", err);
      });
  }, []);

  const revenueGap = revenue.expected - revenue.reported;
  const collectionRate = revenue.expected > 0 ? Math.round((revenue.reported / revenue.expected) * 100) : 0;

  const controlSignal = useMemo(() => {
    if (consoleData.overdueShifts > 0) return "Shift delays need intervention.";
    if (consoleData.offlineDrivers.length > 0) return "Live vehicles have dropped tracking signal.";
    if (consoleData.escalatedRemittances > 0) return "Revenue variances are escalated for review.";
    return "Operations are moving within expected control limits.";
  }, [consoleData]);

  return (
    <div className="dashboard">
      <header className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="dashboard-kicker">Admin Operations Console</p>
          <h1>Track 23 Control Room</h1>
          <p className="dashboard-subtitle">
            Dispatch control, remittance discipline, route intelligence, and live fleet monitoring across the launch corridor.
          </p>
        </div>
        <div className="dashboard-hero-meta">
          <div className="dashboard-date-card">
            <span>Today</span>
            <strong>{new Date().toLocaleDateString()}</strong>
          </div>
          <div className="dashboard-health-card">
            <span>Operations Signal</span>
            <strong>{controlSignal}</strong>
          </div>
        </div>
      </header>

      <section className="kpi-grid">
        <article className="kpi-card">
          <p className="kpi-label">Expected Revenue</p>
          <h2>{formatMoney(revenue.expected)}</h2>
          <span className="kpi-note">Approved shift benchmark</span>
        </article>

        <article className="kpi-card">
          <p className="kpi-label">Approved Revenue</p>
          <h2>{formatMoney(revenue.reported)}</h2>
          <span className="kpi-note">Reconciled collections</span>
        </article>

        <article className="kpi-card">
          <p className="kpi-label">Revenue Gap</p>
          <h2 className={revenueGap > 0 ? "negative" : "positive"}>{formatMoney(Math.abs(revenueGap))}</h2>
          <span className="kpi-note">{revenueGap > 0 ? "Still unreconciled" : "At or above plan"}</span>
        </article>

        <article className="kpi-card">
          <p className="kpi-label">Collection Rate</p>
          <h2>{collectionRate}%</h2>
          <span className="kpi-note">Approved versus expected</span>
        </article>

        <article className="kpi-card">
          <p className="kpi-label">Completed Trips</p>
          <h2>{consoleData.tripMetrics.completedTrips}</h2>
          <span className="kpi-note">Executed corridor trips</span>
        </article>

        <article className="kpi-card">
          <p className="kpi-label">Passenger Volume</p>
          <h2>{consoleData.tripMetrics.passengerCount}</h2>
          <span className="kpi-note">Captured from shift reporting</span>
        </article>

        <article className="kpi-card">
          <p className="kpi-label">Avg Load / Trip</p>
          <h2>{consoleData.tripMetrics.avgPassengersPerTrip}</h2>
          <span className="kpi-note">Passengers per trip</span>
        </article>

        <article className="kpi-card">
          <p className="kpi-label">Avg Cycle Time</p>
          <h2>
            {consoleData.tripMetrics.avgDurationMinutes != null
              ? `${consoleData.tripMetrics.avgDurationMinutes} mins`
              : "-"}
          </h2>
          <span className="kpi-note">Observed shift duration</span>
        </article>
      </section>

      <section className="dashboard-main-grid">
        <article className="insight-panel">
          <div className="panel-head">
            <h3>Control Tower</h3>
            <span className="panel-chip">Live Ops</span>
          </div>
          <div className="dispatch-stat-grid">
            <div className="dispatch-stat-card">
              <span>Live Buses</span>
              <strong>{consoleData.liveShifts}</strong>
            </div>
            <div className="dispatch-stat-card">
              <span>Pending Handover</span>
              <strong>{consoleData.pendingHandover}</strong>
            </div>
            <div className="dispatch-stat-card">
              <span>Overdue Shifts</span>
              <strong>{consoleData.overdueShifts}</strong>
            </div>
            <div className="dispatch-stat-card">
              <span>Awaiting Close</span>
              <strong>{consoleData.completedAwaitingClose}</strong>
            </div>
          </div>
        </article>

        <article className="insight-panel">
          <div className="panel-head">
            <h3>Exception Queue</h3>
            <span className="panel-chip">Action</span>
          </div>
          <div className="snapshot-row">
            <span>Pending Remittances</span>
            <strong>{consoleData.pendingRemittances}</strong>
          </div>
          <div className="snapshot-row">
            <span>Escalated Variances</span>
            <strong>{consoleData.escalatedRemittances}</strong>
          </div>
          <div className="snapshot-row">
            <span>Offline Drivers</span>
            <strong>{consoleData.offlineDrivers.length}</strong>
          </div>
          <div className="snapshot-row">
            <span>Open Maintenance</span>
            <strong>{consoleData.unresolvedMaintenance}</strong>
          </div>
        </article>
      </section>

      <section className="dashboard-lower-grid">
        <article className="map-panel">
          <div className="map-header">
            <h3>Route Operations Map</h3>
            <p>Iyana-Iba to Egbeda corridor, live bus locations, and tracked drivers.</p>
          </div>
          <FleetMap />
        </article>

        <article className="insight-panel">
          <div className="panel-head">
            <h3>Live Dispatch</h3>
            <span className="panel-chip">Road</span>
          </div>
          <div className="dashboard-list">
            {consoleData.liveOperations.map((item) => (
              <div className="dashboard-list-item" key={item.shiftId}>
                <div>
                  <strong>{item.driver}</strong>
                  <p>
                    {item.bus} · {item.route}
                  </p>
                </div>
                <div className="dashboard-list-meta">
                  <span className={`badge ${item.remittanceSubmitted ? "active" : "standby"}`}>
                    {item.remittanceSubmitted ? "REMITTED" : "LIVE"}
                  </span>
                  <p>{new Date(item.startedAt).toLocaleTimeString()}</p>
                  <p>
                    {item.completedTrips || 0} trips · {item.passengerCount || 0} pax
                  </p>
                </div>
              </div>
            ))}
            {consoleData.liveOperations.length === 0 ? (
              <p className="empty-state">No buses are on route right now.</p>
            ) : null}
          </div>
        </article>
      </section>

      <section className="dashboard-main-grid">
        <article className="insight-panel">
          <div className="panel-head">
            <h3>Driver Tracking Alerts</h3>
            <span className="panel-chip">Monitoring</span>
          </div>
          <div className="dashboard-list">
            {consoleData.offlineDrivers.map((item) => (
              <div className="dashboard-list-item" key={item.shiftId}>
                <div>
                  <strong>{item.driver}</strong>
                  <p>
                    {item.bus} · {item.route}
                  </p>
                </div>
                <div className="dashboard-list-meta">
                  <span className="badge standby">TRACKING LOST</span>
                </div>
              </div>
            ))}
            {consoleData.offlineDrivers.length === 0 ? (
              <p className="empty-state">All live drivers are reporting location.</p>
            ) : null}
          </div>
        </article>

        <article className="insight-panel">
          <div className="panel-head">
            <h3>Overdue Dispatches</h3>
            <span className="panel-chip">Delays</span>
          </div>
          <div className="dashboard-list">
            {consoleData.overdueShiftList.map((item) => (
              <div className="dashboard-list-item" key={item.shiftId}>
                <div>
                  <strong>{item.driver}</strong>
                  <p>
                    {item.bus} · {item.route}
                  </p>
                </div>
                <div className="dashboard-list-meta">
                  <span className="badge maintenance">OVERDUE</span>
                  <p>{new Date(item.scheduledEnd).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            {consoleData.overdueShiftList.length === 0 ? (
              <p className="empty-state">No shift delays at the moment.</p>
            ) : null}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head" style={{ marginBottom: 12 }}>
          <h3>Route Intelligence</h3>
          <span className="panel-chip">Planning</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Planned Distance</th>
                <th>Target Duration</th>
                <th>Trips / Shift</th>
                <th>Actual Trips</th>
                <th>Passengers</th>
                <th>Avg Load</th>
                <th>Revenue / Trip</th>
                <th>Active Buses</th>
                <th>Completed Shifts</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {consoleData.routePerformance.map((item) => (
                <tr key={item.routeId}>
                  <td>{item.routeName}</td>
                  <td>{item.plannedDistanceKm ? `${item.plannedDistanceKm} km` : "-"}</td>
                  <td>{item.targetDurationMinutes ? `${item.targetDurationMinutes} mins` : "-"}</td>
                  <td>{item.plannedTripsPerShift || "-"}</td>
                  <td>{item.totalTrips}</td>
                  <td>{item.totalPassengers}</td>
                  <td>{item.avgPassengersPerTrip}</td>
                  <td>{formatMoney(item.revenuePerTrip)}</td>
                  <td>{item.activeBuses}</td>
                  <td>{item.completedShifts}</td>
                  <td>{formatMoney(item.reportedRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

