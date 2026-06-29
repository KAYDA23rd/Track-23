// Sidebar navigation for management screens.
// Hosts primary app navigation, role app shortcuts,
// responsive collapse behavior, and logout.
import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearSession } from "../utils/authSession";

const ICON_PATHS = {
  menu: "M4 7h16M4 12h16M4 17h16",
  dashboard: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
  bus: "M6 4h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2v2h-2v-2H8v2H6v-2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM7 7v4h10V7H7zm1 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z",
  drivers: "M9 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm8 1a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM3 20a6 6 0 0 1 12 0H3zm11 0a5 5 0 0 1 7 0h-7z",
  staff: "M4 20v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2M9 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 3a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  supervisor:
    "M12 3l7 4v5c0 4.6-2.8 8.8-7 10-4.2-1.2-7-5.4-7-10V7l7-4zm0 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-3.5 8h7a3.5 3.5 0 0 0-7 0z",
  shifts: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 5v5.3l3.7 2.2-1 1.7L11 13V7z",
  routes:
    "M17 16c-1.3 0-2.4.84-2.82 2H13v-3h1c1.1 0 2-.9 2-2V8.82c1.16-.41 2-1.51 2-2.82 0-1.66-1.34-3-3-3s-3 1.34-3 3c0 1.3.84 2.4 2 2.82V13h-1c-1.1 0-2 .9-2 2v3H9.82C9.4 16.84 8.3 16 7 16c-1.66 0-3 1.34-3 3s1.34 3 3 3c1.3 0 2.4-.84 2.82-2h4.36c.42 1.16 1.52 2 2.82 2 1.66 0 3-1.34 3-3s-1.34-3-3-3z",
  remittances: "M19 2H5a2 2 0 0 0-2 2v16l4-4h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-3 9H8V9h8v2zm0-3H8V6h8v2zm-2 6H8v-2h6v2z",
  driverApp: "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm1 3v12h8V5H8zm4 15a1.2 1.2 0 1 0 0 .01V20z",
  mechanicApp:
    "M14.7 6.3l3 3-7.9 7.9H6.8v-3l7.9-7.9zm1.4-1.4l1.2-1.2a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-1.2 1.2-3-3zM4 20h16",
  logout: "M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5v-2H5V6h5zm7.6 4.6L16.2 10l1.8 2H9v2h9l-1.8 2 1.4 1.4L22 13z",
};

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", iconKey: "dashboard" },
  { to: "/buses", label: "Fleet", iconKey: "bus" },
  { to: "/drivers", label: "Drivers", iconKey: "drivers" },
  { to: "/staff", label: "General Staff", iconKey: "staff" },
  { to: "/supervisor/login", label: "Supervisor App", iconKey: "supervisor" },
  { to: "/shifts", label: "Shifts", iconKey: "shifts" },
  { to: "/routes", label: "Routes", iconKey: "routes" },
  { to: "/remittances", label: "Remittances", iconKey: "remittances" },
  { to: "/driver/login", label: "Driver App", iconKey: "driverApp" },
  { to: "/mechanic/login", label: "Mechanic App", iconKey: "mechanicApp" },
];

function Sidebar({ isOpen, onToggle, onNavigate }) {
  const navigate = useNavigate();

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${isOpen ? "" : "is-collapsed"}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-row">
          <button
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="sidebar-toggle"
            onClick={onToggle}
            type="button"
          >
            <Icon d={ICON_PATHS.menu} />
          </button>
          <Link className="sidebar-logo-link" title="Go to homepage" to="/">
            <h1>{isOpen ? "Track 23" : "T23"}</h1>
          </Link>
        </div>
        <p className="sidebar-brand-meta">Transport Management</p>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            title={item.label}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) => `sidebar-link ${isActive ? "is-active" : ""}`}
          >
            <span className="sidebar-link-icon">
              <Icon d={ICON_PATHS[item.iconKey]} />
            </span>
            <span className="sidebar-link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="sidebar-logout" onClick={logout} title="Log out" type="button">
        <span className="sidebar-link-icon">
          <Icon d={ICON_PATHS.logout} />
        </span>
        <span className="sidebar-link-label">Log out</span>
      </button>
    </aside>
  );
}

export default Sidebar;

