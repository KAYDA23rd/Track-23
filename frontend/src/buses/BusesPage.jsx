// Fleet management page.
// Handles bus creation, status changes, service readiness,
// and maintenance-aware fleet controls.
import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/pages.css";

export default function BusesPage() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [tickets, setTickets] = useState([]);

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
    const [busesRes, routesRes, ticketsRes] = await Promise.all([
      api.get("/buses"),
      api.get("/routes"),
      api.get("/maintenance"),
    ]);

    setBuses(busesRes.data);
    setRoutes(routesRes.data);
    setTickets(ticketsRes.data);
  };

  useEffect(() => {
    const init = async () => {
      const [busesRes, routesRes, ticketsRes] = await Promise.all([
        api.get("/buses"),
        api.get("/routes"),
        api.get("/maintenance"),
      ]);
      setBuses(busesRes.data);
      setRoutes(routesRes.data);
      setTickets(ticketsRes.data);
    };

    init();
  }, []);

  const addBus = async (e) => {
    e.preventDefault();

    if (!routeId) {
      alert("Please select a route");
      return;
    }

    await api.post("/buses", { plateNumber, model, routeId });

    setPlateNumber("");
    setModel("");
    setRouteId("");

    loadData();
  };

  const startEdit = (bus) => {
    setEditingId(bus.id);
    setEditData({
      plateNumber: bus.plateNumber,
      model: bus.model,
      routeId: bus.routeId,
      status: bus.status,
    });
  };

  const saveEdit = async () => {
    await api.put(`/buses/${editingId}`, editData);
    setEditingId(null);
    loadData();
  };

  const deleteBus = async (id) => {
    if (!confirm("Delete this bus?")) return;
    await api.delete(`/buses/${id}`);
    loadData();
  };

  const statusClass = (status) => {
    if (status === "ACTIVE") return "badge active";
    if (status === "INACTIVE" || status === "MAINTENANCE") return "badge maintenance";
    return "badge standby";
  };

  const busHistory = (busId) => tickets.filter((ticket) => ticket.busId === busId).slice(0, 3);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1 className="page-title">Fleet</h1>
          <p className="page-subtitle">Manage buses, route assignments, and status.</p>
        </div>
        <div className="page-count">{buses.length} buses</div>
      </header>

      <section className="panel">
        <h3>Add Bus</h3>
        <form className="form-grid" onSubmit={addBus}>
          <input
            className="field"
            placeholder="Plate number"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            required
          />

          <input
            className="field"
            placeholder="Bus model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            required
          />

          <select
            className="select"
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            required
          >
            <option value="">Select route</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name} ({route.startPoint} -&gt; {route.endPoint})
              </option>
            ))}
          </select>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              Add Bus
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h3>Fleet List</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Plate</th>
                <th>Model</th>
                <th>Route</th>
                <th>Status</th>
                <th>Maintenance History</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buses.map((bus) => (
                <tr key={bus.id}>
                  {editingId === bus.id ? (
                    <>
                      <td>
                        <input
                          className="field"
                          value={editData.plateNumber}
                          onChange={(e) =>
                            setEditData({ ...editData, plateNumber: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="field"
                          value={editData.model}
                          onChange={(e) => setEditData({ ...editData, model: e.target.value })}
                        />
                      </td>
                      <td>
                        <select
                          className="select"
                          value={editData.routeId}
                          onChange={(e) => setEditData({ ...editData, routeId: e.target.value })}
                        >
                          {routes.map((route) => (
                            <option key={route.id} value={route.id}>
                              {route.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="select"
                          value={editData.status}
                          onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                          disabled={bus.isUnderRepair}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="STANDBY">STANDBY</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </td>
                      <td>
                        <span className="empty-state">Maintenance history visible after save.</span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-primary" onClick={saveEdit}>
                            Save
                          </button>
                          <button className="btn btn-neutral" onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </div>
                        {bus.isUnderRepair ? (
                          <p className="empty-state">Bus is under repair and cannot be reactivated yet.</p>
                        ) : null}
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{bus.plateNumber}</td>
                      <td>{bus.model}</td>
                      <td>{bus.route?.name || "Unassigned"}</td>
                      <td>
                        <div className="stack-sm">
                          <span className={statusClass(bus.status)}>{bus.status}</span>
                          {bus.isUnderRepair ? (
                          <span className="empty-state">Inactive until repair is resolved</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <div className="stack-sm">
                          {busHistory(bus.id).length > 0 ? (
                            busHistory(bus.id).map((ticket) => (
                              <span key={ticket.id}>
                                {ticket.status} · {ticket.issue}
                              </span>
                            ))
                          ) : (
                            <span className="empty-state">No repair history</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-neutral" onClick={() => startEdit(bus)}>
                            Edit
                          </button>
                          <button className="btn btn-danger" onClick={() => deleteBus(bus.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {buses.length === 0 && <p className="empty-state">No buses yet.</p>}
      </section>
    </div>
  );
}

