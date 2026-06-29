// General staff administration page.
// Approves mechanics and supervisors, controls account
// activation, and shows staff directory status.
import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import "../styles/pages.css";
import { decodeRole } from "../utils/authSession";

const decodeRoleFromToken = () => {
  return decodeRole();
};

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [pendingStaff, setPendingStaff] = useState([]);
  const [filter, setFilter] = useState("all");
  const role = useMemo(() => decodeRoleFromToken(), []);
  const isSuperAdmin = role === "SUPER_ADMIN";

  const loadData = async () => {
    const [staffRes, pendingRes] = await Promise.all([
      api.get("/auth/staff"),
      api.get("/auth/staff/pending"),
    ]);

    setStaff(staffRes.data);
    setPendingStaff(pendingRes.data);
  };

  useEffect(() => {
    const init = async () => {
      await loadData();
    };

    init();
  }, []);

  const approveStaff = async (id) => {
    await api.put(`/auth/staff/${id}/approve`);
    await loadData();
  };

  const setStaffStatus = async (id, isActive) => {
    await api.put(`/auth/staff/${id}/status`, { isActive });
    await loadData();
  };

  const visibleStaff = useMemo(() => {
    if (filter === "mechanic") return staff.filter((user) => user.role === "MECHANIC");
    if (filter === "supervisor") return staff.filter((user) => user.role === "SUPERVISOR");
    if (filter === "admin") return staff.filter((user) => ["ADMIN", "SUPER_ADMIN"].includes(user.role));
    if (filter === "active") return staff.filter((user) => user.isActive);
    if (filter === "inactive") return staff.filter((user) => !user.isActive);
    return staff;
  }, [filter, staff]);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1 className="page-title">General Staff</h1>
          <p className="page-subtitle">
            Approve mechanic signups, control general staff access, and monitor non-driver platform roles.
          </p>
        </div>
        <div className="page-count">{staff.length} staff accounts</div>
      </header>

      <section className="form-grid">
        <article className="panel">
          <h3>Pending Staff</h3>
          <h2 style={{ margin: "8px 0 0" }}>{pendingStaff.length}</h2>
        </article>
        <article className="panel">
          <h3>Mechanics</h3>
          <h2 style={{ margin: "8px 0 0" }}>{staff.filter((user) => user.role === "MECHANIC").length}</h2>
        </article>
        <article className="panel">
          <h3>Supervisors</h3>
          <h2 style={{ margin: "8px 0 0" }}>{staff.filter((user) => user.role === "SUPERVISOR").length}</h2>
        </article>
        <article className="panel">
          <h3>Active Staff</h3>
          <h2 style={{ margin: "8px 0 0" }}>{staff.filter((user) => user.isActive).length}</h2>
        </article>
      </section>

      <section className="panel">
        <h3>Pending Staff Approvals</h3>
        {pendingStaff.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Requested</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingStaff.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.phone}</td>
                    <td>{user.role}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-primary" onClick={() => approveStaff(user.id)} type="button">
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No pending general staff accounts.</p>
        )}
      </section>

      <section className="panel">
        <div className="page-header" style={{ marginBottom: 10 }}>
          <h3>Staff Directory</h3>
          <div className="form-actions">
            <button className={`btn ${filter === "all" ? "btn-primary" : "btn-neutral"}`} onClick={() => setFilter("all")} type="button">
              All
            </button>
            <button className={`btn ${filter === "mechanic" ? "btn-primary" : "btn-neutral"}`} onClick={() => setFilter("mechanic")} type="button">
              Mechanics
            </button>
            <button className={`btn ${filter === "supervisor" ? "btn-primary" : "btn-neutral"}`} onClick={() => setFilter("supervisor")} type="button">
              Supervisors
            </button>
            <button className={`btn ${filter === "admin" ? "btn-primary" : "btn-neutral"}`} onClick={() => setFilter("admin")} type="button">
              Admins
            </button>
            <button className={`btn ${filter === "active" ? "btn-primary" : "btn-neutral"}`} onClick={() => setFilter("active")} type="button">
              Active
            </button>
            <button className={`btn ${filter === "inactive" ? "btn-primary" : "btn-neutral"}`} onClick={() => setFilter("inactive")} type="button">
              Inactive
            </button>
          </div>
        </div>

        {isSuperAdmin ? <p className="empty-state">Super admin can see and govern all staff approvals.</p> : null}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Approved</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleStaff.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.phone}</td>
                  <td>{user.role}</td>
                  <td>
                    <span className={`badge ${user.isActive ? "active" : "standby"}`}>
                      {user.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td>{user.approvedAt ? new Date(user.approvedAt).toLocaleDateString() : "-"}</td>
                  <td>
                    {user.role === "SUPER_ADMIN" ? (
                      <span className="empty-state">Locked</span>
                    ) : (
                      <button
                        className={`btn ${user.isActive ? "btn-danger" : "btn-primary"}`}
                        onClick={() => setStaffStatus(user.id, !user.isActive)}
                        type="button"
                      >
                        {user.isActive ? "Suspend" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visibleStaff.length === 0 ? <p className="empty-state">No staff accounts found.</p> : null}
      </section>
    </div>
  );
}

