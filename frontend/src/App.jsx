import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import Dashboard from "./dashboard/Dashboard";
import RoutesPage from "./routes/RoutesPage";
import BusesPage from "./buses/BusesPage";
import DriversPage from "./drivers/DriversPage";
import ShiftsPage from "./shifts/ShiftsPage";
import ProtectedRoute from "./auth/ProtectedRoute";
import MainLayout from "./layout/MainLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Layout Wrapper */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/buses" element={<BusesPage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/shifts" element={<ShiftsPage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;