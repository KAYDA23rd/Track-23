import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../styles/layout.css";

function MainLayout() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 900);

  useEffect(() => {
    const onResize = () => {
      const nextMobile = window.innerWidth <= 900;
      setIsMobile((prevMobile) => {
        if (prevMobile !== nextMobile) {
          setIsSidebarOpen(!nextMobile);
        }
        return nextMobile;
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div
      className={`app-shell ${isSidebarOpen ? "" : "sidebar-collapsed"} ${
        isMobile && isSidebarOpen ? "mobile-nav-open" : ""
      }`}
    >
      <Sidebar
        isOpen={isSidebarOpen}
        onNavigate={isMobile ? () => setIsSidebarOpen(false) : undefined}
        onToggle={toggleSidebar}
      />

      {isMobile && isSidebarOpen ? (
        <button
          aria-label="Close menu overlay"
          className="app-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <main className="app-content">
        {isMobile ? (
          <header className="mobile-topbar">
            <button className="mobile-sidebar-trigger" onClick={toggleSidebar} type="button">
              {isSidebarOpen ? "Close" : "Menu"}
            </button>
            <Link className="mobile-brand" to="/">
              Track 23
            </Link>
          </header>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
