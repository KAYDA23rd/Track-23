import { Link, useNavigate } from "react-router-dom";

export default function NavBar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand + Navigation */}
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-wide text-emerald-400">
            TRACK23
          </span>

          <div className="flex gap-8 text-sm font-medium">
            <Link to="/dashboard" className="hover:text-emerald-400">
              Dashboard
            </Link>
            <Link to="/routes" className="hover:text-emerald-400">
              Routes
            </Link>
            <Link to="/buses" className="hover:text-emerald-400">
              Buses
            </Link>
            <Link to="/drivers" className="hover:text-emerald-400">
              Drivers
            </Link>
            <Link to="/shifts" className="hover:text-emerald-400">
              Shifts
            </Link>
          </div>
        </div>

        {/* User Actions */}
        <button
          onClick={handleLogout}
          className="rounded bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
