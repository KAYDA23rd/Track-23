// React entry point for the frontend application.
// Boots the app, shared styles, and global map icon setup.
// React 18 imports for application initialization
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Global styles for entire application
import "./index.css";

// Main App component containing routing and layout
import App from "./App.jsx";

// Leaflet map library styles and configuration
import "leaflet/dist/leaflet.css";
import "./utils/leafletIconFix";

// Render React application to the root DOM element
// StrictMode helps identify potential problems during development
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

