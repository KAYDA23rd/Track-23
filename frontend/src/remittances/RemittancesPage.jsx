import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import "../styles/pages.css";

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

export default function RemittancesPage() {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [remittances, setRemittances] = useState([]);
  const [expectedAmount, setExpectedAmount] = useState(25000);
  const [expectedAmountInput, setExpectedAmountInput] = useState("25000");
  const [form, setForm] = useState({
    busId: "",
    driverId: "",
    reportedAmount: "",
  });

  const [filter, setFilter] = useState("all");
  const role = decodeRoleFromToken();
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isSuperAdmin = role === "SUPER_ADMIN";

  const loadData = async () => {
    const [busesRes, driversRes, remRes, expectedRes] = await Promise.all([
      api.get("/buses"),
      api.get("/drivers"),
      api.get("/remittances"),
      api.get("/remittances/expected-amount"),
    ]);

    setBuses(busesRes.data);
    setDrivers(driversRes.data);
    setRemittances(remRes.data);
    setExpectedAmount(expectedRes.data.expectedAmount);
    setExpectedAmountInput(String(expectedRes.data.expectedAmount));
  };

  useEffect(() => {
    const init = async () => {
      const [busesRes, driversRes, remRes, expectedRes] = await Promise.all([
        api.get("/buses"),
        api.get("/drivers"),
        api.get("/remittances"),
        api.get("/remittances/expected-amount"),
      ]);

      setBuses(busesRes.data);
      setDrivers(driversRes.data);
      setRemittances(remRes.data);
      setExpectedAmount(expectedRes.data.expectedAmount);
      setExpectedAmountInput(String(expectedRes.data.expectedAmount));
    };

    init();
  }, []);

  const submitRemittance = async (e) => {
    e.preventDefault();

    await api.post("/remittances", {
      busId: form.busId,
      driverId: form.driverId,
      reportedAmount: Number(form.reportedAmount),
    });

    setForm({ busId: "", driverId: "", reportedAmount: "" });
    loadData();
  };

  const updateExpectedAmount = async (e) => {
    e.preventDefault();

    try {
      await api.put("/remittances/expected-amount", {
        expectedAmount: Number(expectedAmountInput),
      });
      await loadData();
    } catch (error) {
      const message = error?.response?.data?.error || "Unable to update expected amount.";
      alert(message);
    }
  };

  const approveRemittance = async (id) => {
    try {
      await api.put(`/remittances/${id}/approve`);
      loadData();
    } catch (error) {
      const message = error?.response?.data?.error || "Only ADMIN can approve remittances.";
      alert(message);
    }
  };

  const visibleRemittances = useMemo(() => {
    if (filter === "approved") return remittances.filter((item) => item.approved);
    if (filter === "pending") return remittances.filter((item) => !item.approved);
    return remittances;
  }, [filter, remittances]);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1 className="page-title">Remittances</h1>
          <p className="page-subtitle">Submit daily collections and approve reconciliations.</p>
        </div>
        <div className="page-count">{remittances.length} records</div>
      </header>

      <section className="panel">
        <h3>Expected Amount Policy</h3>
        {isSuperAdmin ? (
          <form className="form-grid" onSubmit={updateExpectedAmount}>
            <input
              className="field"
              min="0"
              onChange={(e) => setExpectedAmountInput(e.target.value)}
              type="number"
              value={expectedAmountInput}
              required
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
        <h3>Submit Remittance</h3>
        <form className="form-grid" onSubmit={submitRemittance}>
          <select
            className="select"
            value={form.busId}
            onChange={(e) => setForm({ ...form, busId: e.target.value })}
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
            onChange={(e) => setForm({ ...form, driverId: e.target.value })}
            required
          >
            <option value="">Select driver</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>

          <input
            className="field"
            min="0"
            value={expectedAmount}
            placeholder="Expected amount"
            readOnly
            type="number"
          />

          <input
            className="field"
            min="0"
            onChange={(e) => setForm({ ...form, reportedAmount: e.target.value })}
            placeholder="Reported amount"
            required
            type="number"
            value={form.reportedAmount}
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
          <h3>Remittance Log</h3>
          <div className="form-actions">
            <button
              className={`btn ${filter === "all" ? "btn-primary" : "btn-neutral"}`}
              onClick={() => setFilter("all")}
              type="button"
            >
              All
            </button>
            <button
              className={`btn ${filter === "pending" ? "btn-primary" : "btn-neutral"}`}
              onClick={() => setFilter("pending")}
              type="button"
            >
              Pending
            </button>
            <button
              className={`btn ${filter === "approved" ? "btn-primary" : "btn-neutral"}`}
              onClick={() => setFilter("approved")}
              type="button"
            >
              Approved
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bus</th>
                <th>Driver</th>
                <th>Expected (NGN)</th>
                <th>Reported (NGN)</th>
                <th>Gap (NGN)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRemittances.map((item) => {
                const gap = item.expectedAmount - item.reportedAmount;

                return (
                  <tr key={item.id}>
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                    <td>{item.bus?.plateNumber || "-"}</td>
                    <td>{item.driver?.name || "-"}</td>
                    <td>{item.expectedAmount.toLocaleString()}</td>
                    <td>{item.reportedAmount.toLocaleString()}</td>
                    <td className={gap > 0 ? "negative" : "positive"}>{Math.abs(gap).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${item.approved ? "active" : "standby"}`}>
                        {item.approved ? "APPROVED" : "PENDING"}
                      </span>
                    </td>
                    <td>
                      {!item.approved ? (
                        <button
                          className="btn btn-neutral"
                          disabled={!isAdmin}
                          onClick={() => approveRemittance(item.id)}
                          title={isAdmin ? "Approve remittance" : "Admin access required"}
                          type="button"
                        >
                          Approve
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {visibleRemittances.length === 0 && <p className="empty-state">No remittances found.</p>}
      </section>
    </div>
  );
}
