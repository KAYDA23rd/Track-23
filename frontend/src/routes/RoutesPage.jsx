// Route planning page.
// Maintains corridor definitions, mapped endpoints, and
// route planning assumptions for dispatch operations.
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import api from "../api/api";
import "../styles/pages.css";
import "../styles/routes.css";

const lagosCenter = [6.5244, 3.3792];
const EGBEDA_BUS_STOP = { name: "Egbeda Bus Stop, Lagos", lat: 6.599194, lng: 3.291361 };
const IYANA_IBA_BUS_STOP = { name: "Iyana-Iba Bus Stop, Lagos", lat: 6.463611, lng: 3.204917 };

const emptyDraft = {
  name: "",
  startPoint: "",
  endPoint: "",
  startLat: "",
  startLng: "",
  endLat: "",
  endLng: "",
  plannedDistanceKm: "",
  targetDurationMinutes: "",
  turnaroundMinutes: "",
  plannedTripsPerShift: "",
  peakHeadwayMinutes: "",
  offPeakHeadwayMinutes: "",
};

const toPayload = (route) => ({
  name: route.name,
  startPoint: route.startPoint,
  endPoint: route.endPoint,
  startLat: route.startLat === "" ? null : Number(route.startLat),
  startLng: route.startLng === "" ? null : Number(route.startLng),
  endLat: route.endLat === "" ? null : Number(route.endLat),
  endLng: route.endLng === "" ? null : Number(route.endLng),
  plannedDistanceKm: route.plannedDistanceKm === "" ? null : Number(route.plannedDistanceKm),
  targetDurationMinutes:
    route.targetDurationMinutes === "" ? null : Number(route.targetDurationMinutes),
  turnaroundMinutes: route.turnaroundMinutes === "" ? null : Number(route.turnaroundMinutes),
  plannedTripsPerShift:
    route.plannedTripsPerShift === "" ? null : Number(route.plannedTripsPerShift),
  peakHeadwayMinutes: route.peakHeadwayMinutes === "" ? null : Number(route.peakHeadwayMinutes),
  offPeakHeadwayMinutes:
    route.offPeakHeadwayMinutes === "" ? null : Number(route.offPeakHeadwayMinutes),
});

const coordText = (lat, lng) => {
  if (lat == null || lng == null || lat === "" || lng === "") return "Not set";
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
};

const geocodeLocation = async (query) => {
  if (!query.trim()) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=ng&q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to geocode location");
  return response.json();
};

const reverseGeocode = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const response = await fetch(url);
  if (!response.ok) return "Pinned location";
  const data = await response.json();
  return data.display_name || "Pinned location";
};

const haversineKm = (a, b) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const s1 = Math.sin(dLat / 2) * Math.sin(dLat / 2);
  const s2 =
    Math.cos(toRad(a[0])) *
    Math.cos(toRad(b[0])) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(s1 + s2), Math.sqrt(1 - (s1 + s2)));
  return r * c;
};

function RoutePicker({ onPick }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      onPick(lat, lng);
    },
  });

  return null;
}

function FitPlannerBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length >= 2) {
      map.fitBounds(points, { padding: [36, 36] });
    }
  }, [map, points]);

  return null;
}

function LocationInput({
  label,
  value,
  coords,
  options,
  onChange,
  onSearch,
  onApplyOption,
  onTargetPin,
  isTarget,
}) {
  return (
    <div className="route-location-card">
      <div className="route-location-head">
        <h4>{label}</h4>
        <button
          className={`btn ${isTarget ? "btn-primary" : "btn-neutral"}`}
          onClick={onTargetPin}
          type="button"
        >
          {isTarget ? "Pinning Now" : "Pin On Map"}
        </button>
      </div>

      <input className="field" onChange={onChange} placeholder={`Search ${label}`} value={value} />

      <div className="geo-actions">
        <button className="btn btn-neutral" onClick={onSearch} type="button">
          Search
        </button>
        <span className="geo-coords">{coords}</span>
      </div>

      {options.length > 0 && (
        <div className="geo-results">
          {options.map((place) => (
            <button
              className="geo-result"
              key={`${place.lat}-${place.lon}`}
              onClick={() => onApplyOption(place)}
              type="button"
            >
              {place.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [pinTarget, setPinTarget] = useState("start");
  const [startOptions, setStartOptions] = useState([]);
  const [endOptions, setEndOptions] = useState([]);
  const [routeGeometry, setRouteGeometry] = useState([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState(null);
  const [distanceType, setDistanceType] = useState("road");

  const loadRoutes = async () => {
    const res = await api.get("/routes");
    setRoutes(res.data);
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const startCoords = useMemo(() => {
    if (draft.startLat === "" || draft.startLng === "") return null;
    return [Number(draft.startLat), Number(draft.startLng)];
  }, [draft.startLat, draft.startLng]);

  const endCoords = useMemo(() => {
    if (draft.endLat === "" || draft.endLng === "") return null;
    return [Number(draft.endLat), Number(draft.endLng)];
  }, [draft.endLat, draft.endLng]);

  useEffect(() => {
    const drawRoute = async () => {
      if (!startCoords || !endCoords) {
        setRouteGeometry([]);
        setRouteDistanceKm(null);
        return;
      }

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`;
        const response = await fetch(url);

        if (!response.ok) throw new Error("OSRM fetch failed");
        const data = await response.json();

        if (data.routes?.[0]?.geometry?.coordinates) {
          const path = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setRouteGeometry(path);
          setRouteDistanceKm(data.routes[0].distance / 1000);
          setDistanceType("road");
          return;
        }
      } catch {
        // fallback below
      }

      setRouteGeometry([startCoords, endCoords]);
      setRouteDistanceKm(haversineKm(startCoords, endCoords));
      setDistanceType("straight");
    };

    drawRoute();
  }, [startCoords, endCoords]);

  const searchPoint = async (target) => {
    const query = target === "start" ? draft.startPoint : draft.endPoint;
    const results = await geocodeLocation(query);

    if (target === "start") setStartOptions(results);
    else setEndOptions(results);
  };

  const applyOption = (target, place) => {
    if (target === "start") {
      setDraft((prev) => ({
        ...prev,
        startPoint: place.display_name,
        startLat: place.lat,
        startLng: place.lon,
      }));
      setStartOptions([]);
      return;
    }

    setDraft((prev) => ({
      ...prev,
      endPoint: place.display_name,
      endLat: place.lat,
      endLng: place.lon,
    }));
    setEndOptions([]);
  };

  const setPointFromMap = async (target, lat, lng) => {
    const label = await reverseGeocode(lat, lng);

    if (target === "start") {
      setDraft((prev) => ({
        ...prev,
        startPoint: label,
        startLat: lat,
        startLng: lng,
      }));
      return;
    }

    setDraft((prev) => ({
      ...prev,
      endPoint: label,
      endLat: lat,
      endLng: lng,
    }));
  };

  const onMapPick = (lat, lng) => {
    setPointFromMap(pinTarget, lat, lng);
  };

  const onMarkerDragEnd = (target, event) => {
    const { lat, lng } = event.target.getLatLng();
    setPointFromMap(target, lat, lng);
  };

  const usePreset = () => {
    setDraft((prev) => ({
      ...prev,
      name: prev.name || "Egbeda - Iyana-Iba",
      startPoint: EGBEDA_BUS_STOP.name,
      startLat: EGBEDA_BUS_STOP.lat,
      startLng: EGBEDA_BUS_STOP.lng,
      endPoint: IYANA_IBA_BUS_STOP.name,
      endLat: IYANA_IBA_BUS_STOP.lat,
      endLng: IYANA_IBA_BUS_STOP.lng,
      plannedDistanceKm: prev.plannedDistanceKm || "19.6",
      targetDurationMinutes: prev.targetDurationMinutes || "55",
      turnaroundMinutes: prev.turnaroundMinutes || "15",
      plannedTripsPerShift: prev.plannedTripsPerShift || "6",
      peakHeadwayMinutes: prev.peakHeadwayMinutes || "12",
      offPeakHeadwayMinutes: prev.offPeakHeadwayMinutes || "20",
    }));
    setStartOptions([]);
    setEndOptions([]);
  };

  const swapPoints = () => {
    setDraft((prev) => ({
      ...prev,
      startPoint: prev.endPoint,
      startLat: prev.endLat,
      startLng: prev.endLng,
      endPoint: prev.startPoint,
      endLat: prev.startLat,
      endLng: prev.startLng,
    }));
  };

  const clearPlanner = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setPinTarget("start");
    setStartOptions([]);
    setEndOptions([]);
    setRouteGeometry([]);
    setRouteDistanceKm(null);
  };

  const submitRoute = async (e) => {
    e.preventDefault();

    if (!draft.startPoint || !draft.endPoint) {
      alert("Set both start and end points before saving.");
      return;
    }

    if (editingId) {
      await api.put(`/routes/${editingId}`, toPayload(draft));
    } else {
      await api.post("/routes", toPayload(draft));
    }

    clearPlanner();
    loadRoutes();
  };

  const editRoute = (route) => {
    setEditingId(route.id);
    setDraft({
      name: route.name,
      startPoint: route.startPoint,
      endPoint: route.endPoint,
      startLat: route.startLat ?? "",
      startLng: route.startLng ?? "",
      endLat: route.endLat ?? "",
      endLng: route.endLng ?? "",
      plannedDistanceKm: route.plannedDistanceKm ?? "",
      targetDurationMinutes: route.targetDurationMinutes ?? "",
      turnaroundMinutes: route.turnaroundMinutes ?? "",
      plannedTripsPerShift: route.plannedTripsPerShift ?? "",
      peakHeadwayMinutes: route.peakHeadwayMinutes ?? "",
      offPeakHeadwayMinutes: route.offPeakHeadwayMinutes ?? "",
    });
    setPinTarget("start");
  };

  const deleteRoute = async (id) => {
    if (!confirm("Delete this route?")) return;
    await api.delete(`/routes/${id}`);
    if (editingId === id) clearPlanner();
    loadRoutes();
  };

  const plannerPoints = [startCoords, endCoords].filter(Boolean);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1 className="page-title">Routes</h1>
          <p className="page-subtitle">
            Plan routes with map pinning, route highlighting, and distance visibility.
          </p>
        </div>
        <div className="page-count">{routes.length} routes</div>
      </header>

      <section className="route-workspace panel">
        <form className="route-form" onSubmit={submitRoute}>
          <div className="route-form-header">
            <h3>{editingId ? "Update Route" : "Create Route"}</h3>
            {editingId && <span className="route-editing-pill">Editing existing route</span>}
          </div>

          <input
            className="field"
            placeholder="Route name"
            value={draft.name}
            onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
            required
          />

          <div className="route-location-grid">
            <LocationInput
              coords={coordText(draft.startLat, draft.startLng)}
              isTarget={pinTarget === "start"}
              label="Start"
              onApplyOption={(place) => applyOption("start", place)}
              onChange={(e) => setDraft((prev) => ({ ...prev, startPoint: e.target.value }))}
              onSearch={() => searchPoint("start")}
              onTargetPin={() => setPinTarget("start")}
              options={startOptions}
              value={draft.startPoint}
            />

            <LocationInput
              coords={coordText(draft.endLat, draft.endLng)}
              isTarget={pinTarget === "end"}
              label="End"
              onApplyOption={(place) => applyOption("end", place)}
              onChange={(e) => setDraft((prev) => ({ ...prev, endPoint: e.target.value }))}
              onSearch={() => searchPoint("end")}
              onTargetPin={() => setPinTarget("end")}
              options={endOptions}
              value={draft.endPoint}
            />
          </div>

          <div className="form-grid">
            <input
              className="field"
              min="0"
              onChange={(e) => setDraft((prev) => ({ ...prev, plannedDistanceKm: e.target.value }))}
              placeholder="Planned distance (km)"
              step="0.1"
              type="number"
              value={draft.plannedDistanceKm}
            />

            <input
              className="field"
              min="0"
              onChange={(e) => setDraft((prev) => ({ ...prev, targetDurationMinutes: e.target.value }))}
              placeholder="Target duration (mins)"
              type="number"
              value={draft.targetDurationMinutes}
            />

            <input
              className="field"
              min="0"
              onChange={(e) => setDraft((prev) => ({ ...prev, turnaroundMinutes: e.target.value }))}
              placeholder="Turnaround (mins)"
              type="number"
              value={draft.turnaroundMinutes}
            />

            <input
              className="field"
              min="0"
              onChange={(e) => setDraft((prev) => ({ ...prev, plannedTripsPerShift: e.target.value }))}
              placeholder="Planned trips / shift"
              type="number"
              value={draft.plannedTripsPerShift}
            />

            <input
              className="field"
              min="0"
              onChange={(e) => setDraft((prev) => ({ ...prev, peakHeadwayMinutes: e.target.value }))}
              placeholder="Peak headway (mins)"
              type="number"
              value={draft.peakHeadwayMinutes}
            />

            <input
              className="field"
              min="0"
              onChange={(e) => setDraft((prev) => ({ ...prev, offPeakHeadwayMinutes: e.target.value }))}
              placeholder="Off-peak headway (mins)"
              type="number"
              value={draft.offPeakHeadwayMinutes}
            />
          </div>

          <div className="form-actions route-actions">
            <button className="btn btn-neutral" onClick={usePreset} type="button">
              Egbeda to Iyana-Iba
            </button>
            <button className="btn btn-neutral" onClick={swapPoints} type="button">
              Swap
            </button>
            <button className="btn btn-neutral" onClick={clearPlanner} type="button">
              Clear
            </button>
            <button className="btn btn-primary" type="submit">
              {editingId ? "Update Route" : "Save Route"}
            </button>
          </div>

          <div className="route-planner-meta">
            <strong>Pin target:</strong> {pinTarget === "start" ? "Start" : "End"}
            {routeDistanceKm != null && (
              <span className="route-distance">
                Distance: {routeDistanceKm.toFixed(2)} km ({distanceType})
              </span>
            )}
          </div>
        </form>

        <div className="route-planner-map">
          <MapContainer center={lagosCenter} zoom={11} style={{ height: "420px", width: "100%" }}>
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <RoutePicker onPick={onMapPick} />
            <FitPlannerBounds points={plannerPoints} />

            {startCoords && (
              <Marker
                draggable
                eventHandlers={{ dragend: (event) => onMarkerDragEnd("start", event) }}
                position={startCoords}
              >
                <Popup>Start point</Popup>
              </Marker>
            )}

            {endCoords && (
              <Marker
                draggable
                eventHandlers={{ dragend: (event) => onMarkerDragEnd("end", event) }}
                position={endCoords}
              >
                <Popup>End point</Popup>
              </Marker>
            )}

            {routeGeometry.length >= 2 && (
              <Polyline
                pathOptions={{ color: "#0f9b6d", weight: 6, opacity: 0.9 }}
                positions={routeGeometry}
              />
            )}
          </MapContainer>
        </div>
      </section>

      <section className="panel">
        <h3>Saved Routes</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Start</th>
                <th>End</th>
                <th>Start Coords</th>
                <th>End Coords</th>
                <th>Ops Target</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id}>
                  <td>{route.name}</td>
                  <td>{route.startPoint}</td>
                  <td>{route.endPoint}</td>
                  <td>{coordText(route.startLat, route.startLng)}</td>
                  <td>{coordText(route.endLat, route.endLng)}</td>
                  <td>
                    <div className="stack-sm">
                      <span>{route.plannedDistanceKm ? `${route.plannedDistanceKm} km` : "No distance set"}</span>
                      <span>
                        {route.targetDurationMinutes ? `${route.targetDurationMinutes} mins` : "No duration set"}
                      </span>
                      <span>
                        {route.plannedTripsPerShift ? `${route.plannedTripsPerShift} trips / shift` : "No trip target"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-neutral" onClick={() => editRoute(route)} type="button">
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => deleteRoute(route.id)} type="button">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {routes.length === 0 && <p className="empty-state">No routes yet.</p>}
      </section>
    </div>
  );
}

