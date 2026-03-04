import { useEffect, useState } from "react";
import api from "../api/api";

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", startPoint: "", endPoint: "" });

  const loadRoutes = async () => {
    const res = await api.get("/routes");
    setRoutes(res.data);
  };

  useEffect(() => {
    const fetchRoutes = async () => {
      const res = await api.get("/routes");
      setRoutes(res.data);
    };
    fetchRoutes();
  }, []);

  const startEdit = (route) => {
    setEditingId(route.id);
    setForm(route);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", startPoint: "", endPoint: "" });
  };

  const saveEdit = async () => {
    await api.put(`/routes/${editingId}`, form);
    cancelEdit();
    loadRoutes();
  };

  const deleteRoute = async (id) => {
    if (!confirm("Delete this route?")) return;
    await api.delete(`/routes/${id}`);
    loadRoutes();
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Routes</h2>

      <ul>
        {routes.map((r) => (
          <li key={r.id}>
            {editingId === r.id ? (
              <>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  value={form.startPoint}
                  onChange={(e) =>
                    setForm({ ...form, startPoint: e.target.value })
                  }
                />
                <input
                  value={form.endPoint}
                  onChange={(e) =>
                    setForm({ ...form, endPoint: e.target.value })
                  }
                />
                <button onClick={saveEdit}>Save</button>
                <button onClick={cancelEdit}>Cancel</button>
              </>
            ) : (
              <>
                {r.name} ({r.startPoint} → {r.endPoint})
                <button onClick={() => startEdit(r)}>Edit</button>
                <button onClick={() => deleteRoute(r.id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
