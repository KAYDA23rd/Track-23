import { useEffect, useState } from "react";
import api from "../api/api";


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
    const fetchData = async () => {
      try {
        const [busesRes, driversRes, shiftsRes] = await Promise.all([
          api.get("/buses"),
          api.get("/drivers"),
          api.get("/shifts"),
        ]);

        setBuses(busesRes.data);
        setDrivers(driversRes.data);
        setShifts(shiftsRes.data);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };

    fetchData();
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
    <div style={{ padding: 40 }}>
      <h2>Shifts</h2>

      <form onSubmit={addShift}>
        <select value={busId} onChange={(e) => setBusId(e.target.value)}>
          <option value="">Select bus</option>
          {buses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.plateNumber}
            </option>
          ))}
        </select>

        <br />
        <br />

        <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
          <option value="">Select driver</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <br />
        <br />

        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
        <br />
        <br />

        <input
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
        <br />
        <br />

        <button>Add Shift</button>
      </form>

      <hr />

      <ul>
        {shifts.map((s) => (
          <li key={s.id}>
            {s.driver?.name} → {s.bus?.plateNumber} (
            {new Date(s.startTime).toLocaleString()} –
            {new Date(s.endTime).toLocaleString()})
            <button onClick={() => deleteShift(s.id)}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
