import { useEffect, useState } from "react";
import api from "../api/api";
import FleetMap from "../components/FleetMap";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [data, setData] = useState({ expected: 0, reported: 0 });

  const revenueGap = data.expected - data.reported;
  const collectionRate =
    data.expected > 0 ? Math.round((data.reported / data.expected) * 100) : 0;

  useEffect(() => {
    api
      .get("/reports/daily-revenue")
      .then((res) => setData(res.data))
      .catch(() => {
        localStorage.removeItem("token");
        window.location.href = "/";
      });
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-kicker">Operations Console</p>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">
            Live financial and fleet monitoring for Track 23.
          </p>
        </div>
        <div className="dashboard-date">{new Date().toLocaleDateString()}</div>
      </header>

      <section className="kpi-grid">
        <article className="kpi-card">
          <p className="kpi-label">Expected Revenue</p>
          <h2>NGN {data.expected.toLocaleString()}</h2>
          <span className="kpi-note">Daily benchmark target</span>
        </article>

        <article className="kpi-card">
          <p className="kpi-label">Reported Revenue</p>
          <h2>NGN {data.reported.toLocaleString()}</h2>
          <span className="kpi-note">Confirmed cash + digital collections</span>
        </article>

        <article className="kpi-card">
          <p className="kpi-label">Revenue Gap</p>
          <h2 className={revenueGap > 0 ? "negative" : "positive"}>
            NGN {Math.abs(revenueGap).toLocaleString()}
          </h2>
          <span className="kpi-note">
            {revenueGap > 0 ? "Below target" : "Above target"}
          </span>
        </article>

        <article className="kpi-card">
          <p className="kpi-label">Collection Rate</p>
          <h2>{collectionRate}%</h2>
          <span className="kpi-note">Reported vs expected</span>
        </article>
      </section>

      <section className="insight-grid">
        <article className="insight-panel">
          <h3>Performance Snapshot</h3>
          <div className="snapshot-row">
            <span>Collection Efficiency</span>
            <strong>{collectionRate}%</strong>
          </div>
          <div className="snapshot-row">
            <span>Variance</span>
            <strong className={revenueGap > 0 ? "negative" : "positive"}>
              NGN {Math.abs(revenueGap).toLocaleString()}
            </strong>
          </div>
          <div className="snapshot-row">
            <span>Liquidity Health</span>
            <strong>{collectionRate >= 85 ? "Stable" : "Watchlist"}</strong>
          </div>
        </article>

        <article className="insight-panel">
          <h3>Cashflow Signal</h3>
          <p>
            {collectionRate >= 85
              ? "Collections are within healthy range. Maintain shift-level enforcement and route compliance."
              : "Collections are below expected threshold. Review route leakages and driver remittance exceptions."}
          </p>
        </article>
      </section>

      <section className="map-panel">
        <div className="map-header">
          <h3>Launch Route Focus</h3>
          <p>Operational corridor: Iyana-Iba to Egbeda and Egbeda to Iyana-Iba.</p>
        </div>
        <FleetMap />
      </section>
    </div>
  );
}
