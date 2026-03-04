import { useEffect, useState } from "react";
import api from "../api/api";

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", licenseNo: "" });

  const loadDrivers = async () => {
    const res = await api.get("/drivers");
    setDrivers(res.data);
  };

  useEffect(() => {
    const fetchDrivers = async () => {
      const res = await api.get("/drivers");
      setDrivers(res.data);
    };

    fetchDrivers();
  }, []);

  const startEdit = (d) => {
    setEditingId(d.id);
    setForm(d);
  };

  const saveEdit = async () => {
    await api.put(`/drivers/${editingId}`, form);
    setEditingId(null);
    loadDrivers();
  };

  const deleteDriver = async (id) => {
    if (!confirm("Delete this driver?")) return;
    await api.delete(`/drivers/${id}`);
    loadDrivers();
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Drivers</h2>

      <ul>
        {drivers.map((d) => (
          <li key={d.id}>
            {editingId === d.id ? (
              <>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <input
                  value={form.licenseNo}
                  onChange={(e) =>
                    setForm({ ...form, licenseNo: e.target.value })
                  }
                />
                <button onClick={saveEdit}>Save</button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <>
                {d.name} — {d.phone} — {d.licenseNo}
                <button onClick={() => startEdit(d)}>Edit</button>
                <button onClick={() => deleteDriver(d.id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
