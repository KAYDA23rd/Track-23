// Dispatch and shift control page.
// Manages issuance, handover, route start, completion,
// close-out, and trip productivity updates.
import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import "../styles/pages.css";

const toLocalInputValue = (value) => {
  const date = value ? new Date(value) : new Date();
  const offset = date.getTimezoneOffset();
  const normalized = new Date(date.getTime() - offset * 60 * 1000);
  return normalized.toISOString().slice(0, 16);
};

const statusBadgeClass = (status) => {
  if (status === "ON_ROUTE") return "badge active";
  if (status === "COMPLETED" || status === "CLOSED") return "badge maintenance";
  return "badge standby";
};

const initialForm = () => ({
  busId: "",
  driverId: "",
  startTime: toLocalInputValue(),
  endTime: toLocalInputValue(new Date(Date.now() + 8 * 60 * 60 * 1000)),
  odometerOut: "",
  fuelOutPercent: "",
  handoverNotes: "",
});

const initialReturnForm = { odometerIn: "", fuelInPercent: "", returnNotes: "" };
const initialPerformanceForm = {
  completedTrips: "",
  completedLoops: "",
  passengerCount: "",
  tripPerformanceNotes: "",
};

export default function ShiftsPage() {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [returnForms, setReturnForms] = useState({});
  const [performanceForms, setPerformanceForms] = useState({});

  const loadData = async () => {
    const [busesRes, driversRes, shiftsRes] = await Promise.all([
      api.get("/buses"),
      api.get("/drivers"),
      api.get("/shifts"),
    ]);

    setBuses(busesRes.data);
    setDrivers(driversRes.data);
    setShifts(shiftsRes.data);
  };

  useEffect(() => {
    loadData().catch(() => {
      setBuses([]);
      setDrivers([]);
      setShifts([]);
    });
  }, []);

  const selectedBus = buses.find((bus) => bus.id === form.busId) || null;
  const dispatchableBuses = buses.filter((bus) => !bus.isUnderRepair && bus.status !== "MAINTENANCE");

  const shiftCounts = useMemo(
    () => ({
      assigned: shifts.filter((shift) => shift.status === "ASSIGNED").length,
      handedOver: shifts.filter((shift) => shift.status === "HANDED_OVER").length,
      live: shifts.filter((shift) => shift.status === "ON_ROUTE").length,
      awaitingClose: shifts.filter((shift) => shift.status === "COMPLETED").length,
    }),
    [shifts],
  );

  const visibleShifts = useMemo(() => {
    if (filter === "control") {
      return shifts.filter((shift) => ["ASSIGNED", "HANDED_OVER", "ON_ROUTE", "COMPLETED"].includes(shift.status));
    }
    if (filter === "exceptions") {
      return shifts.filter((shift) => shift.isDelayed || (shift.status === "COMPLETED" && !shift.remittanceSubmitted));
    }
    if (filter === "closed") {
      return shifts.filter((shift) => shift.status === "CLOSED");
    }
    return shifts;
  }, [filter, shifts]);

  const addShift = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.post("/shifts", form);
      setForm(initialForm());
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to create shift.");
    } finally {
      setSubmitting(false);
    }
  };

  const performShiftAction = async (shift, action) => {
    try {
      if (action === "confirm") {
        await api.put(`/shifts/${shift.id}/confirm`);
      }

      if (action === "start") {
        await api.put(`/shifts/${shift.id}/start`);
      }

      if (action === "complete") {
        const payload = returnForms[shift.id] || initialReturnForm;
        const performancePayload = performanceForms[shift.id] || initialPerformanceForm;
        await api.put(`/shifts/${shift.id}/complete`, { ...payload, ...performancePayload });
      }

      if (action === "close") {
        await api.put(`/shifts/${shift.id}/close`);
      }

      await loadData();
    } catch (err) {
      alert(err?.response?.data?.error || "Unable to update shift.");
    }
  };

  const deleteShift = async (id) => {
    if (!confirm("Delete this shift?")) return;
    await api.delete(`/shifts/${id}`);
    await loadData();
  };

  const setReturnField = (shiftId, key, value) => {
    setReturnForms((prev) => ({
      ...prev,
      [shiftId]: {
        ...(prev[shiftId] || initialReturnForm),
        [key]: value,
      },
    }));
  };

  const setPerformanceField = (shiftId, key, value) => {
    setPerformanceForms((prev) => ({
      ...prev,
      [shiftId]: {
        ...(prev[shiftId] || initialPerformanceForm),
        [key]: value,
      },
    }));
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1 className="page-title">Dispatch Lifecycle</h1>
          <p className="page-subtitle">
            Issue buses, confirm handover, move buses on route, and close the operating day with return data.
          </p>
        </div>
        <div className="page-count">{shifts.length} total shifts</div>
      </header>

      <section className="form-grid">
        <article className="panel">
          <h3>Assigned</h3>
          <p className="empty-state">Awaiting admin handover.</p>
          <h2 style={{ margin: "8px 0 0" }}>{shiftCounts.assigned}</h2>
        </article>
        <article className="panel">
          <h3>Handed Over</h3>
          <p className="empty-state">Issued but not yet on route.</p>
          <h2 style={{ margin: "8px 0 0" }}>{shiftCounts.handedOver}</h2>
        </article>
        <article className="panel">
          <h3>On Route</h3>
          <p className="empty-state">Live buses under dispatch.</p>
          <h2 className="positive" style={{ margin: "8px 0 0" }}>{shiftCounts.live}</h2>
        </article>
        <article className="panel">
          <h3>Awaiting Close</h3>
          <p className="empty-state">Completed shifts waiting for remittance review.</p>
          <h2 style={{ margin: "8px 0 0" }}>{shiftCounts.awaitingClose}</h2>
        </article>
      </section>

      <section className="panel">
        <h3>Issue Bus to Driver</h3>
        <form className="form-grid" onSubmit={addShift}>
          <select
            className="select"
            onChange={(e) => setForm((prev) => ({ ...prev, busId: e.target.value }))}
            required
            value={form.busId}
          >
            <option value="">Select bus</option>
            {dispatchableBuses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.plateNumber} · {bus.route?.name || "No route"}
              </option>
            ))}
          </select>

          <select
            className="select"
            onChange={(e) => setForm((prev) => ({ ...prev, driverId: e.target.value }))}
            required
            value={form.driverId}
          >
            <option value="">Select driver</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>

          <input
            className="datetime"
            onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
            required
            type="datetime-local"
            value={form.startTime}
          />

          <input
            className="datetime"
            onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
            required
            type="datetime-local"
            value={form.endTime}
          />

          <input
            className="field"
            min="0"
            onChange={(e) => setForm((prev) => ({ ...prev, odometerOut: e.target.value }))}
            placeholder="Odometer out"
            type="number"
            value={form.odometerOut}
          />

          <input
            className="field"
            max="100"
            min="0"
            onChange={(e) => setForm((prev) => ({ ...prev, fuelOutPercent: e.target.value }))}
            placeholder="Fuel out %"
            type="number"
            value={form.fuelOutPercent}
          />

          <input
            className="field"
            onChange={(e) => setForm((prev) => ({ ...prev, handoverNotes: e.target.value }))}
            placeholder="Handover notes"
            value={form.handoverNotes}
          />

          <div className="form-actions">
            <button className="btn btn-primary" disabled={submitting} type="submit">
              {submitting ? "Issuing..." : "Issue Bus"}
            </button>
          </div>
        </form>

        {selectedBus ? (
          <p className="empty-state" style={{ marginTop: 12 }}>
            Route: {selectedBus.route?.startPoint || "-"} to {selectedBus.route?.endPoint || "-"} · Bus status:{" "}
            {selectedBus.status}
          </p>
        ) : null}
        {dispatchableBuses.length === 0 ? (
          <p className="empty-state" style={{ marginTop: 12 }}>
            No buses are dispatchable right now. Vehicles under repair stay inactive until workshop resolution is complete.
          </p>
        ) : null}
        {error ? <p className="empty-state" style={{ color: "#bb3040" }}>{error}</p> : null}
      </section>

      <section className="panel">
        <div className="page-header" style={{ marginBottom: 10 }}>
          <h3>Control Board</h3>
          <div className="form-actions">
            <button
              className={`btn ${filter === "all" ? "btn-primary" : "btn-neutral"}`}
              onClick={() => setFilter("all")}
              type="button"
            >
              All
            </button>
            <button
              className={`btn ${filter === "control" ? "btn-primary" : "btn-neutral"}`}
              onClick={() => setFilter("control")}
              type="button"
            >
              Active Flow
            </button>
            <button
              className={`btn ${filter === "exceptions" ? "btn-primary" : "btn-neutral"}`}
              onClick={() => setFilter("exceptions")}
              type="button"
            >
              Exceptions
            </button>
            <button
              className={`btn ${filter === "closed" ? "btn-primary" : "btn-neutral"}`}
              onClick={() => setFilter("closed")}
              type="button"
            >
              Closed
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Bus / Route</th>
                <th>Window</th>
                <th>Status</th>
                <th>Issue Log</th>
                <th>Trip Performance</th>
                <th>Return Log</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleShifts.map((shift) => {
                const returnForm = returnForms[shift.id] || initialReturnForm;
                const performanceForm = performanceForms[shift.id] || initialPerformanceForm;

                return (
                  <tr key={shift.id}>
                    <td>
                      <strong>{shift.driver?.name || "-"}</strong>
                      <br />
                      <span className="empty-state">{shift.driver?.phone || "-"}</span>
                    </td>
                    <td>
                      <strong>{shift.bus?.plateNumber || "-"}</strong>
                      <br />
                      <span className="empty-state">{shift.bus?.route?.name || "-"}</span>
                    </td>
                    <td>
                      {new Date(shift.startTime).toLocaleString()}
                      <br />
                      <span className="empty-state">{new Date(shift.endTime).toLocaleString()}</span>
                    </td>
                    <td>
                      <span className={statusBadgeClass(shift.status)}>{shift.status}</span>
                      {shift.isDelayed ? <p className="negative">Overdue shift</p> : null}
                      {shift.remittanceSubmitted ? <p className="positive">Remittance submitted</p> : null}
                    </td>
                    <td>
                      <div className="stack-sm">
                        <span>Odo out: {shift.odometerOut ?? "-"}</span>
                        <span>Fuel out: {shift.fuelOutPercent ?? "-"}%</span>
                        <span>{shift.handoverNotes || "No handover note"}</span>
                      </div>
                    </td>
                    <td>
                      {shift.status === "COMPLETED" || shift.status === "CLOSED" ? (
                        <div className="stack-sm">
                          <span>Trips: {shift.completedTrips ?? 0}</span>
                          <span>Loops: {shift.completedLoops ?? 0}</span>
                          <span>Passengers: {shift.passengerCount ?? 0}</span>
                          <span>
                            Avg passengers/trip:{" "}
                            {shift.completedTrips > 0
                              ? (shift.passengerCount / shift.completedTrips).toFixed(1)
                              : "0.0"}
                          </span>
                          <span>{shift.tripPerformanceNotes || "No trip notes"}</span>
                        </div>
                      ) : (
                        <div className="stack-sm">
                          <input
                            className="field"
                            min="0"
                            onChange={(e) => setPerformanceField(shift.id, "completedTrips", e.target.value)}
                            placeholder="Completed trips"
                            type="number"
                            value={performanceForm.completedTrips}
                          />
                          <input
                            className="field"
                            min="0"
                            onChange={(e) => setPerformanceField(shift.id, "completedLoops", e.target.value)}
                            placeholder="Completed loops"
                            type="number"
                            value={performanceForm.completedLoops}
                          />
                          <input
                            className="field"
                            min="0"
                            onChange={(e) => setPerformanceField(shift.id, "passengerCount", e.target.value)}
                            placeholder="Passenger count"
                            type="number"
                            value={performanceForm.passengerCount}
                          />
                          <input
                            className="field"
                            onChange={(e) => setPerformanceField(shift.id, "tripPerformanceNotes", e.target.value)}
                            placeholder="Trip notes"
                            value={performanceForm.tripPerformanceNotes}
                          />
                        </div>
                      )}
                    </td>
                    <td>
                      {shift.status === "COMPLETED" || shift.status === "CLOSED" ? (
                        <div className="stack-sm">
                          <span>Odo in: {shift.odometerIn ?? "-"}</span>
                          <span>Fuel in: {shift.fuelInPercent ?? "-"}%</span>
                          <span>{shift.returnNotes || "No return note"}</span>
                          <span>
                            Actual duration:{" "}
                            {shift.actualDurationMinutes != null ? `${shift.actualDurationMinutes} mins` : "-"}
                          </span>
                        </div>
                      ) : (
                        <div className="stack-sm">
                          <input
                            className="field"
                            min="0"
                            onChange={(e) => setReturnField(shift.id, "odometerIn", e.target.value)}
                            placeholder="Odometer in"
                            type="number"
                            value={returnForm.odometerIn}
                          />
                          <input
                            className="field"
                            max="100"
                            min="0"
                            onChange={(e) => setReturnField(shift.id, "fuelInPercent", e.target.value)}
                            placeholder="Fuel in %"
                            type="number"
                            value={returnForm.fuelInPercent}
                          />
                          <input
                            className="field"
                            onChange={(e) => setReturnField(shift.id, "returnNotes", e.target.value)}
                            placeholder="Return notes"
                            value={returnForm.returnNotes}
                          />
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        {shift.status === "ASSIGNED" ? (
                          <button className="btn btn-primary" onClick={() => performShiftAction(shift, "confirm")} type="button">
                            Confirm Handover
                          </button>
                        ) : null}
                        {shift.status === "HANDED_OVER" ? (
                          <button className="btn btn-primary" onClick={() => performShiftAction(shift, "start")} type="button">
                            Start Route
                          </button>
                        ) : null}
                        {["HANDED_OVER", "ON_ROUTE"].includes(shift.status) ? (
                          <button className="btn btn-neutral" onClick={() => performShiftAction(shift, "complete")} type="button">
                            Mark Complete
                          </button>
                        ) : null}
                        {shift.status === "COMPLETED" ? (
                          <button className="btn btn-neutral" onClick={() => performShiftAction(shift, "close")} type="button">
                            Close Shift
                          </button>
                        ) : null}
                        {["ASSIGNED", "HANDED_OVER"].includes(shift.status) ? (
                          <button className="btn btn-danger" onClick={() => deleteShift(shift.id)} type="button">
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {visibleShifts.length === 0 ? <p className="empty-state">No dispatch assignments found.</p> : null}
      </section>
    </div>
  );
}

