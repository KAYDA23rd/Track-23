import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import Dashboard from "./dashboard/Dashboard";
import RoutesPage from "./routes/RoutesPage";
import BusesPage from "./buses/BusesPage";
import DriversPage from "./drivers/DriversPage";
import ShiftsPage from "./shifts/ShiftsPage";
import RemittancesPage from "./remittances/RemittancesPage";
import ProtectedRoute from "./auth/ProtectedRoute";
import MainLayout from "./layout/MainLayout";
import DriverLogin from "./driver/DriverLogin";
import DriverApp from "./driver/DriverApp";
import DriverProtectedRoute from "./driver/DriverProtectedRoute";
import LandingPage from "./landing/LandingPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Route */}
        <Route path="/login" element={<Login />} />
        <Route path="/driver/login" element={<DriverLogin />} />
        <Route
          path="/driver/app"
          element={
            <DriverProtectedRoute>
              <DriverApp />
            </DriverProtectedRoute>
          }
        />

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
          <Route path="/remittances" element={<RemittancesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
