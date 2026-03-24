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

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", licenseNo: "" });
  const [newDriver, setNewDriver] = useState({ name: "", phone: "", licenseNo: "" });
  const [newAdmin, setNewAdmin] = useState({ name: "", phone: "", email: "", password: "" });
  const [adminMessage, setAdminMessage] = useState("");
  const role = useMemo(() => decodeRoleFromToken(), []);
  const isStaffAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isSuperAdmin = role === "SUPER_ADMIN";

  const loadDrivers = async () => {
    const res = await api.get("/drivers");
    setDrivers(res.data);
  };

  const loadPendingUsers = async () => {
    if (!isStaffAdmin) {
      setPendingUsers([]);
      return;
    }

    try {
      const res = await api.get("/auth/drivers/pending");
      setPendingUsers(res.data);
    } catch {
      setPendingUsers([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      const driversRes = await api.get("/drivers");
      setDrivers(driversRes.data);

      if (isStaffAdmin) {
        try {
          const pendingRes = await api.get("/auth/drivers/pending");
          setPendingUsers(pendingRes.data);
        } catch {
          setPendingUsers([]);
        }
      }
    };

    init();
  }, [isStaffAdmin]);

  const createAdminAccount = async (e) => {
    e.preventDefault();
    setAdminMessage("");

    try {
      await api.post("/auth/create-admin", newAdmin);
      setNewAdmin({ name: "", phone: "", email: "", password: "" });
      setAdminMessage("Admin account created successfully.");
    } catch (error) {
      const message = error?.response?.data?.error || "Unable to create admin account.";
      setAdminMessage(message);
    }
  };

  const addDriver = async (e) => {
    e.preventDefault();
    await api.post("/drivers", newDriver);
    setNewDriver({ name: "", phone: "", licenseNo: "" });
    loadDrivers();
  };

  const startEdit = (driver) => {
    setEditingId(driver.id);
    setForm({ name: driver.name, phone: driver.phone, licenseNo: driver.licenseNo });
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

  const approveDriverAccount = async (userId) => {
    await api.put(`/auth/drivers/${userId}/approve`);
    loadPendingUsers();
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1 className="page-title">Drivers</h1>
          <p className="page-subtitle">Manage driver roster and approve newly created driver accounts.</p>
        </div>
        <div className="page-count">{drivers.length} drivers</div>
      </header>

      {isSuperAdmin && (
        <section className="panel">
          <h3>Create Admin Account</h3>
          <form className="form-grid" onSubmit={createAdminAccount}>
            <input
              className="field"
              placeholder="Admin full name"
              value={newAdmin.name}
              onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
              required
            />
            <input
              className="field"
              placeholder="Phone number"
              value={newAdmin.phone}
              onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
              required
            />
            <input
              className="field"
              type="email"
              placeholder="Email (optional)"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
            />
            <input
              className="field"
              type="password"
              placeholder="Temporary password"
              value={newAdmin.password}
              onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
              required
            />
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">
                Create Admin
              </button>
            </div>
          </form>
          {adminMessage ? <p className="empty-state">{adminMessage}</p> : null}
        </section>
      )}

      {isStaffAdmin && (
        <section className="panel">
          <h3>Pending Driver Approvals</h3>
          {pendingUsers.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Requested</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.phone}</td>
                      <td>{user.email || "-"}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-primary"
                          onClick={() => approveDriverAccount(user.id)}
                          type="button"
                        >
                          Approve Account
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">No pending driver accounts.</p>
          )}
        </section>
      )}

      <section className="panel">
        <h3>Add Driver</h3>
        <form className="form-grid" onSubmit={addDriver}>
          <input
            className="field"
            placeholder="Full name"
            value={newDriver.name}
            onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
            required
          />
          <input
            className="field"
            placeholder="Phone number"
            value={newDriver.phone}
            onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
            required
          />
          <input
            className="field"
            placeholder="License number"
            value={newDriver.licenseNo}
            onChange={(e) => setNewDriver({ ...newDriver, licenseNo: e.target.value })}
            required
          />
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              Add Driver
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h3>Driver List</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>License</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.id}>
                  {editingId === driver.id ? (
                    <>
                      <td>
                        <input
                          className="field"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="field"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="field"
                          value={form.licenseNo}
                          onChange={(e) => setForm({ ...form, licenseNo: e.target.value })}
                        />
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-primary" onClick={saveEdit} type="button">
                            Save
                          </button>
                          <button className="btn btn-neutral" onClick={() => setEditingId(null)} type="button">
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{driver.name}</td>
                      <td>{driver.phone}</td>
                      <td>{driver.licenseNo}</td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-neutral" onClick={() => startEdit(driver)} type="button">
                            Edit
                          </button>
                          <button className="btn btn-danger" onClick={() => deleteDriver(driver.id)} type="button">
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

        {drivers.length === 0 && <p className="empty-state">No drivers yet.</p>}
      </section>
    </div>
  );
}
