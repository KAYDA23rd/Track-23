// Main shell for admin-side pages.
// Hosts the responsive sidebar, page outlet, and mobile
// drawer behavior across dashboard screens.
import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../styles/layout.css";

const DESKTOP_BREAKPOINT = 1024;
const SIDEBAR_STORAGE_KEY = "track23_sidebar_open";
const MOBILE_MENU_PATHS = {
  open: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
};

const isDesktopViewport = () => window.innerWidth > DESKTOP_BREAKPOINT;

const getStoredSidebarPreference = () => {
  let storedValue = null;

  try {
    storedValue = localStorage.getItem(SIDEBAR_STORAGE_KEY);
  } catch {
    return true;
  }

  if (storedValue === null) {
    return true;
  }

  return storedValue === "true";
};

function MobileMenuIcon({ isOpen }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={isOpen ? MOBILE_MENU_PATHS.close : MOBILE_MENU_PATHS.open} />
    </svg>
  );
}

function MainLayout() {
  const [isMobile, setIsMobile] = useState(() => !isDesktopViewport());
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    isDesktopViewport() ? getStoredSidebarPreference() : false,
  );

  useEffect(() => {
    const onResize = () => {
      const nextMobile = !isDesktopViewport();

      setIsMobile((prevMobile) => {
        if (prevMobile !== nextMobile) {
          setIsSidebarOpen(nextMobile ? false : getStoredSidebarPreference());
        }

        return nextMobile;
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      document.body.style.overflow = "";
      return undefined;
    }

    document.body.style.overflow = isSidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, isSidebarOpen]);

  useEffect(() => {
    if (!isMobile) {
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarOpen));
      } catch {
        // Ignore storage failures and keep the current in-memory UI state.
      }
    }
  }, [isMobile, isSidebarOpen]);

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
            <button
              aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
              className="mobile-sidebar-trigger"
              onClick={toggleSidebar}
              title={isSidebarOpen ? "Close menu" : "Open menu"}
              type="button"
            >
              <MobileMenuIcon isOpen={isSidebarOpen} />
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

