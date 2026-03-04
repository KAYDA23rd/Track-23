import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

export default function Dashboard() {
  const [data, setData] = useState({ expected: 0, reported: 0 });

  useEffect(() => {
    api
      .get("/reports/daily-revenue")
      .then((res) => setData(res.data))
      .catch(() => {
        localStorage.removeItem("token");
        window.location.href = "/";
      });
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin Dashboard</h1>

      <p>
        <strong>Expected:</strong> ₦{data.expected}
      </p>
      <p>
        <strong>Reported:</strong> ₦{data.reported}
      </p>

      <hr />

      <nav style={{ display: "flex", gap: 20 }}>
        <Link to="/routes">Routes</Link>
        <Link to="/buses">Buses</Link>
        <Link to="/drivers">Drivers</Link>
        <Link to="/shifts">Shifts</Link>
      </nav>

      <br />
      <button onClick={logout}>Logout</button>
    </div>
  );
}
