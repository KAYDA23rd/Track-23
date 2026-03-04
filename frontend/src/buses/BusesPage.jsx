import { useEffect, useState } from "react";
import api from "../api/api";

export default function BusesPage() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);

  const [plateNumber, setPlateNumber] = useState("");
  const [model, setModel] = useState("");
  const [routeId, setRouteId] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    plateNumber: "",
    model: "",
    routeId: "",
    status: "STANDBY",
  });

  const loadData = async () => {
    const busesRes = await api.get("/buses");
    const routesRes = await api.get("/routes");

    setBuses(busesRes.data);
    setRoutes(routesRes.data);
  };

  useEffect(() => {
    const loadData = async () => {
      const busesRes = await api.get("/buses");
      const routesRes = await api.get("/routes");

      setBuses(busesRes.data);
      setRoutes(routesRes.data);
    };

    loadData();
  }, []);
  // ADD BUS
  const addBus = async (e) => {
    e.preventDefault();

    if (!routeId) {
      alert("Please select a route");
      return;
    }

    await api.post("/buses", {
      plateNumber,
      model,
      routeId,
    });

    setPlateNumber("");
    setModel("");
    setRouteId("");

    loadData();
  };

  // START EDIT
  const startEdit = (bus) => {
    setEditingId(bus.id);
    setEditData({
      plateNumber: bus.plateNumber,
      model: bus.model,
      routeId: bus.routeId,
      status: bus.status,
    });
  };

  // SAVE EDIT
  const saveEdit = async () => {
    await api.put(`/buses/${editingId}`, editData);
    setEditingId(null);
    loadData();
  };

  // DELETE BUS
  const deleteBus = async (id) => {
    if (!confirm("Delete this bus?")) return;
    await api.delete(`/buses/${id}`);
    loadData();
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Buses</h2>

      {/* ADD BUS FORM */}
      <form onSubmit={addBus}>
        <input
          placeholder="Plate number"
          value={plateNumber}
          onChange={(e) => setPlateNumber(e.target.value)}
        />
        <br />
        <br />

        <input
          placeholder="Bus model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
        <br />
        <br />

        <select value={routeId} onChange={(e) => setRouteId(e.target.value)}>
          <option value="">Select route</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.startPoint} → {r.endPoint})
            </option>
          ))}
        </select>

        <br />
        <br />
        <button>Add Bus</button>
      </form>

      <hr />

      {/* BUS LIST */}
      <ul>
        {buses.map((b) => (
          <li key={b.id}>
            {editingId === b.id ? (
              <>
                <input
                  value={editData.plateNumber}
                  onChange={(e) =>
                    setEditData({ ...editData, plateNumber: e.target.value })
                  }
                />

                <input
                  value={editData.model}
                  onChange={(e) =>
                    setEditData({ ...editData, model: e.target.value })
                  }
                />

                <select
                  value={editData.routeId}
                  onChange={(e) =>
                    setEditData({ ...editData, routeId: e.target.value })
                  }
                >
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>

                <select
                  value={editData.status}
                  onChange={(e) =>
                    setEditData({ ...editData, status: e.target.value })
                  }
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="STANDBY">STANDBY</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>

                <button onClick={saveEdit}>Save</button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <>
                {b.plateNumber} — {b.model} — {b.status} — {b.route?.name}
                <button onClick={() => startEdit(b)}>Edit</button>
                <button onClick={() => deleteBus(b.id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
