import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/pages.css";

export default function ShiftsPage() {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [busId, setBusId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

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
    const init = async () => {
      const [busesRes, driversRes, shiftsRes] = await Promise.all([
        api.get("/buses"),
        api.get("/drivers"),
        api.get("/shifts"),
      ]);

      setBuses(busesRes.data);
      setDrivers(driversRes.data);
      setShifts(shiftsRes.data);
    };

    init();
  }, []);

  const addShift = async (e) => {
    e.preventDefault();

    await api.post("/shifts", {
      busId,
      driverId,
      startTime,
      endTime,
    });

    setBusId("");
    setDriverId("");
    setStartTime("");
    setEndTime("");

    loadData();
  };

  const deleteShift = async (id) => {
    if (!confirm("Delete this shift?")) return;
    await api.delete(`/shifts/${id}`);
    loadData();
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1 className="page-title">Shifts</h1>
          <p className="page-subtitle">Assign drivers to buses with precise time windows.</p>
        </div>
        <div className="page-count">{shifts.length} shifts</div>
      </header>

      <section className="panel">
        <h3>Create Shift</h3>
        <form className="form-grid" onSubmit={addShift}>
          <select
            className="select"
            value={busId}
            onChange={(e) => setBusId(e.target.value)}
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
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
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
            className="datetime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />

          <input
            className="datetime"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />

          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              Add Shift
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h3>Shift Schedule</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Bus</th>
                <th>Start</th>
                <th>End</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift.id}>
                  <td>{shift.driver?.name || "-"}</td>
                  <td>{shift.bus?.plateNumber || "-"}</td>
                  <td>{new Date(shift.startTime).toLocaleString()}</td>
                  <td>{new Date(shift.endTime).toLocaleString()}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-danger" onClick={() => deleteShift(shift.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {shifts.length === 0 && <p className="empty-state">No shifts yet.</p>}
      </section>
    </div>
  );
}
