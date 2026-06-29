// Main frontend route map for Track23.
// Wires public entry points and role-specific apps for
// admin, driver, mechanic, and supervisor users.
// React Router for application routing and navigation
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Authentication components
import Login from "./auth/Login";
import ProtectedRoute from "./auth/ProtectedRoute";

// Admin dashboard and management pages
import Dashboard from "./dashboard/Dashboard";
import RoutesPage from "./routes/RoutesPage";
import BusesPage from "./buses/BusesPage";
import DriversPage from "./drivers/DriversPage";
import StaffPage from "./staff/StaffPage";
import ShiftsPage from "./shifts/ShiftsPage";
import RemittancesPage from "./remittances/RemittancesPage";

// Main layout wrapper for admin area
import MainLayout from "./layout/MainLayout";

// Driver mobile app components
import DriverLogin from "./driver/DriverLogin";
import DriverApp from "./driver/DriverApp";
import DriverProtectedRoute from "./driver/DriverProtectedRoute";
import MechanicLogin from "./mechanic/MechanicLogin";
import MechanicApp from "./mechanic/MechanicApp";
import MechanicProtectedRoute from "./mechanic/MechanicProtectedRoute";
import SupervisorLogin from "./supervisor/SupervisorLogin";
import SupervisorApp from "./supervisor/SupervisorApp";
import SupervisorProtectedRoute from "./supervisor/SupervisorProtectedRoute";

// Public landing page
import LandingPage from "./landing/LandingPage";

/**
 * Main App Component
 * Defines all application routes and layout structure
 * Manages navigation between public, admin, and driver sections
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        {/* Landing page - visible to all visitors */}
        <Route path="/" element={<LandingPage />} />

        {/* Admin login page */}
        <Route path="/login" element={<Login />} />

        {/* DRIVER APP ROUTES */}
        {/* Driver login for mobile app */}
        <Route path="/driver/login" element={<DriverLogin />} />

        {/* Protected driver app - requires driver authentication */}
        <Route
          path="/driver/app"
          element={
            <DriverProtectedRoute>
              <DriverApp />
            </DriverProtectedRoute>
          }
        />

        <Route path="/mechanic/login" element={<MechanicLogin />} />
        <Route
          path="/mechanic/app"
          element={
            <MechanicProtectedRoute>
              <MechanicApp />
            </MechanicProtectedRoute>
          }
        />

        <Route path="/supervisor/login" element={<SupervisorLogin />} />
        <Route
          path="/supervisor/app"
          element={
            <SupervisorProtectedRoute>
              <SupervisorApp />
            </SupervisorProtectedRoute>
          }
        />

        {/* ADMIN PROTECTED ROUTES */}
        {/* All routes wrapped in MainLayout require admin authentication */}
        {/* MainLayout provides sidebar navigation and top bar */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard - overview of system metrics */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Routes management - create/edit bus routes */}
          <Route path="/routes" element={<RoutesPage />} />

          {/* Fleet management - view and manage buses */}
          <Route path="/buses" element={<BusesPage />} />

          {/* Drivers management - view driver profiles and status */}
          <Route path="/drivers" element={<DriversPage />} />

          <Route path="/staff" element={<StaffPage />} />

          {/* Shift scheduling - assign drivers to buses and shifts */}
          <Route path="/shifts" element={<ShiftsPage />} />

          {/* Remittances - track driver payments and revenue */}
          <Route path="/remittances" element={<RemittancesPage />} />
        </Route>

        {/* Catch-all route - redirect unknown paths to homepage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

