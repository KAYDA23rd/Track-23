// Remittance management page.
// Handles expected amount visibility, review workflow,
// reconciliation, and escalation handling.
import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import "../styles/pages.css";
import { decodeRole } from "../utils/authSession";

const decodeRoleFromToken = () => {
  return decodeRole();
};

const formatMoney = (value) => Number(value || 0).toLocaleString();

export default function RemittancesPage() {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [remittances, setRemittances] = useState([]);
  const [expectedAmount, setExpectedAmount] = useState(25000);
  const [expectedAmountInput, setExpectedAmountInput] = useState("25000");
  const [summary, setSummary] = useState({
    expected: 0,
    reported: 0,
    variance: 0,
    pending: 0,
    escalated: 0,
    rejected: 0,
  });
  const [form, setForm] = useState({
    busId: "",
    driverId: "",
    reportedAmount: "",
    varianceReason: "",
  });
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [filter, setFilter] = useState("all");
  const role = decodeRoleFromToken();
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isSuperAdmin = role === "SUPER_ADMIN";

  const loadData = async () => {
    const [busesRes, driversRes, remRes, expectedRes, summaryRes] = await Promise.all([
      api.get("/buses"),
      api.get("/drivers"),
      api.get("/remittances"),
      api.get("/remittances/expected-amount"),
      api.get("/remittances/summary"),
    ]);

    setBuses(busesRes.data);
    setDrivers(driversRes.data);
    setRemittances(remRes.data);
    setExpectedAmount(expectedRes.data.expectedAmount);
    setExpectedAmountInput(String(expectedRes.data.expectedAmount));
    setSummary(summaryRes.data);
  };

  useEffect(() => {
    const init = async () => {
      await loadData();
    };

    init();
  }, []);

  const submitRemittance = async (e) => {
    e.preventDefault();

    await api.post("/remittances", {
      busId: form.busId,
      driverId: form.driverId,
      reportedAmount: Number(form.reportedAmount),
      varianceReason: form.varianceReason,
    });

    setForm({ busId: "", driverId: "", reportedAmount: "", varianceReason: "" });
    await loadData();
  };

  const updateExpectedAmount = async (e) => {
    e.preventDefault();

    try {
      await api.put("/remittances/expected-amount", {
        expectedAmount: Number(expectedAmountInput),
      });
      await loadData();
    } catch (error) {
      alert(error?.response?.data?.error || "Unable to update expected amount.");
    }
  };

  const reviewRemittance = async (id, status) => {
    try {
      const draft = reviewDrafts[id] || {};
      await api.put(`/remittances/${id}/review`, {
        status,
        reviewNotes: draft.reviewNotes || "",
      });
      await loadData();
    } catch (error) {
      alert(error?.response?.data?.error || "Unable to review remittance.");
    }
  };

  const setReviewField = (id, key, value) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [key]: value,
      },
    }));
  };

  const visibleRemittances = useMemo(() => {
    if (filter === "pending") return remittances.filter((item) => item.status === "PENDING");
    if (filter === "approved") return remittances.filter((item) => item.status === "APPROVED");
    if (filter === "escalated") return remittances.filter((item) => item.status === "ESCALATED");
    return remittances;
  }, [filter, remittances]);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1 className="page-title">Remittance Reconciliation</h1>
          <p className="page-subtitle">Control expected vs reported cashflow, explain variance, and approve or escalate exceptions.</p>
        </div>
        <div className="page-count">{remittances.length} records</div>
      </header>

      <section className="form-grid">
        <article className="panel">
          <h3>Expected</h3>
          <h2 style={{ margin: "8px 0 0" }}>NGN {formatMoney(summary.expected)}</h2>
        </article>
        <article className="panel">
          <h3>Reported</h3>
          <h2 style={{ margin: "8px 0 0" }}>NGN {formatMoney(summary.reported)}</h2>
        </article>
        <article className="panel">
          <h3>Variance</h3>
          <h2 className={summary.variance < 0 ? "negative" : "positive"} style={{ margin: "8px 0 0" }}>
            NGN {formatMoney(Math.abs(summary.variance))}
          </h2>
        </article>
        <article className="panel">
          <h3>Escalated</h3>
          <h2 style={{ margin: "8px 0 0" }}>{summary.escalated}</h2>
        </article>
      </section>

      <section className="panel">
        <h3>Expected Amount Policy</h3>
        {isSuperAdmin ? (
          <form className="form-grid" onSubmit={updateExpectedAmount}>
            <input
              className="field"
              min="0"
              onChange={(e) => setExpectedAmountInput(e.target.value)}
              required
              type="number"
              value={expectedAmountInput}
            />
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">
                Update Expected Amount
              </button>
            </div>
          </form>
        ) : (
          <p className="empty-state">
            Expected amount is fixed at NGN {expectedAmount.toLocaleString()}. Only Super Admin can update it.
          </p>
        )}
      </section>

      <section className="panel">
        <h3>Manual Remittance Entry</h3>
        <form className="form-grid" onSubmit={submitRemittance}>
          <select
            className="select"
            value={form.busId}
            onChange={(e) => setForm((prev) => ({ ...prev, busId: e.target.value }))}
            required
          >
            <option value="">Select bus</option>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.plateNumber}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={form.driverId}
            onChange={(e) => setForm((prev) => ({ ...prev, driverId: e.target.value }))}
            required
          >
            <option value="">Select driver</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>

          <input className="field" min="0" readOnly type="number" value={expectedAmount} />

          <input
            className="field"
            min="0"
            onChange={(e) => setForm((prev) => ({ ...prev, reportedAmount: e.target.value }))}
            placeholder="Reported amount"
            required
            type="number"
            value={form.reportedAmount}
          />

          <input
            className="field"
            onChange={(e) => setForm((prev) => ({ ...prev, varianceReason: e.target.value }))}
            placeholder="Variance reason if not exact"
            value={form.varianceReason}
          />

          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              Submit
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="page-header" style={{ marginBottom: 10 }}>
          <h3>Reconciliation Log</h3>
          <div className="form-actions">
            <button className={`btn ${filter === "all" ? "btn-primary" : "btn-neutral"}`} onClick={() => setFilter("all")} type="button">
              All
            </button>
            <button className={`btn ${filter === "pending" ? "btn-primary" : "btn-neutral"}`} onClick={() => setFilter("pending")} type="button">
              Pending
            </button>
            <button className={`btn ${filter === "approved" ? "btn-primary" : "btn-neutral"}`} onClick={() => setFilter("approved")} type="button">
              Approved
            </button>
            <button className={`btn ${filter === "escalated" ? "btn-primary" : "btn-neutral"}`} onClick={() => setFilter("escalated")} type="button">
              Escalated
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bus / Route</th>
                <th>Driver</th>
                <th>Expected</th>
                <th>Reported</th>
                <th>Variance</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {visibleRemittances.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.date).toLocaleString()}</td>
                  <td>
                    <strong>{item.bus?.plateNumber || "-"}</strong>
                    <br />
                    <span className="empty-state">{item.bus?.route?.name || "-"}</span>
                  </td>
                  <td>{item.driver?.name || "-"}</td>
                  <td>{formatMoney(item.expectedAmount)}</td>
                  <td>{formatMoney(item.reportedAmount)}</td>
                  <td className={item.varianceAmount < 0 ? "negative" : "positive"}>
                    {formatMoney(Math.abs(item.varianceAmount))}
                  </td>
                  <td>{item.varianceReason || "-"}</td>
                  <td>
                    <span className={`badge ${
                      item.status === "APPROVED" ? "active" : item.status === "ESCALATED" ? "maintenance" : "standby"
                    }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>
                    {item.status === "PENDING" && isAdmin ? (
                      <div className="stack-sm">
                        <input
                          className="field"
                          onChange={(e) => setReviewField(item.id, "reviewNotes", e.target.value)}
                          placeholder="Review note"
                          value={reviewDrafts[item.id]?.reviewNotes || ""}
                        />
                        <div className="row-actions">
                          <button className="btn btn-primary" onClick={() => reviewRemittance(item.id, "APPROVED")} type="button">
                            Approve
                          </button>
                          <button className="btn btn-neutral" onClick={() => reviewRemittance(item.id, "ESCALATED")} type="button">
                            Escalate
                          </button>
                          <button className="btn btn-danger" onClick={() => reviewRemittance(item.id, "REJECTED")} type="button">
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      item.reviewNotes || "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visibleRemittances.length === 0 && <p className="empty-state">No remittances found.</p>}
      </section>
    </div>
  );
}

