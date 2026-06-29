// Driver navigation map.
// Shows route focus, live location context, and the
// expanded navigation experience during active duty.
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

const IYANA_IBA = [6.463611, 3.204917];
const EGBEDA = [6.599194, 3.291361];
const FORWARD_ROUTE_URL = `https://router.project-osrm.org/route/v1/driving/${IYANA_IBA[1]},${IYANA_IBA[0]};${EGBEDA[1]},${EGBEDA[0]}?overview=full&geometries=geojson`;
const toFixedSafe = (value, digits = 1) => (value == null || Number.isNaN(value) ? "-" : Number(value).toFixed(digits));
const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "-";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hours}h ${rem}m`;
};
const formatDistance = (meters) => {
  if (!Number.isFinite(meters) || meters <= 0) return "-";
  return `${(meters / 1000).toFixed(1)} km`;
};

function FitDriverView({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length >= 2) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [map, points]);

  return null;
}

function MapLayout({ fitPoints, roadPath, mapHeight, showPosition, currentPosition }) {
  return (
    <MapContainer center={IYANA_IBA} style={{ height: mapHeight, width: "100%" }} zoom={12}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitDriverView points={fitPoints} />

      <Marker position={IYANA_IBA}>
        <Popup>Iyana-Iba Terminal</Popup>
      </Marker>

      <Marker position={EGBEDA}>
        <Popup>Egbeda Terminal</Popup>
      </Marker>

      {showPosition ? (
        <Marker position={currentPosition}>
          <Popup>Current Driver Location</Popup>
        </Marker>
      ) : null}

      <Polyline pathOptions={{ color: "#0f9b6d", weight: 6 }} positions={roadPath} />
    </MapContainer>
  );
}

export default function DriverNavigationMap({
  currentPosition,
  currentSpeedKph,
  currentAccuracyM,
  lastLocationSyncAt,
  trackingStatus,
  assignedBusLabel,
  className = "",
  defaultHeight = "320px",
}) {
  const [roadPath, setRoadPath] = useState([IYANA_IBA, EGBEDA]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tripMetrics, setTripMetrics] = useState({ durationSec: null, distanceM: null });

  useEffect(() => {
    const loadRoute = async () => {
      try {
        const response = await fetch(FORWARD_ROUTE_URL);
        if (!response.ok) throw new Error("Failed to fetch road path");
        const data = await response.json();
        const coordinates = data?.routes?.[0]?.geometry?.coordinates;
        if (!coordinates?.length) throw new Error("No route geometry");
        setRoadPath(coordinates.map(([lng, lat]) => [lat, lng]));
      } catch {
        setRoadPath([IYANA_IBA, EGBEDA]);
      }
    };

    loadRoute();
  }, []);

  const destination = useMemo(() => {
    if (!currentPosition) return EGBEDA;
    const distanceToEgbeda =
      Math.abs(currentPosition[0] - EGBEDA[0]) + Math.abs(currentPosition[1] - EGBEDA[1]);
    const distanceToIyana =
      Math.abs(currentPosition[0] - IYANA_IBA[0]) + Math.abs(currentPosition[1] - IYANA_IBA[1]);
    return distanceToIyana < distanceToEgbeda ? EGBEDA : IYANA_IBA;
  }, [currentPosition]);

  useEffect(() => {
    const loadTripMetrics = async () => {
      const origin = currentPosition || IYANA_IBA;
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=false`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch trip metrics");
        const data = await response.json();
        const route = data?.routes?.[0];
        if (!route) throw new Error("No route");
        setTripMetrics({
          durationSec: route.duration ?? null,
          distanceM: route.distance ?? null,
        });
      } catch {
        setTripMetrics({ durationSec: null, distanceM: null });
      }
    };

    loadTripMetrics();
  }, [currentPosition, destination]);

  const navHref = currentPosition
    ? `https://www.google.com/maps/dir/?api=1&origin=${currentPosition[0]},${currentPosition[1]}&destination=${destination[0]},${destination[1]}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&origin=${IYANA_IBA[0]},${IYANA_IBA[1]}&destination=${EGBEDA[0]},${EGBEDA[1]}&travelmode=driving`;

  const fitPoints = currentPosition ? [IYANA_IBA, EGBEDA, currentPosition] : [IYANA_IBA, EGBEDA];
  const compactMapHeight = defaultHeight;
  const fullscreenMapHeight = "calc(100dvh - 220px)";
  const etaLabel = useMemo(() => {
    if (!Number.isFinite(tripMetrics.durationSec) || tripMetrics.durationSec <= 0) return "-";
    return new Date(Date.now() + tripMetrics.durationSec * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [tripMetrics.durationSec]);

  useEffect(() => {
    if (!isExpanded) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isExpanded]);

  return (
    <>
      <div className={`driver-card ${className}`.trim()}>
        <div className="driver-card-head">
          <h3>Navigation</h3>
          <div className="driver-nav-actions">
            <button
              className="driver-btn driver-nav-btn driver-nav-btn-max"
              onClick={() => setIsExpanded(true)}
              type="button"
            >
              Maximize Map
            </button>
            <a
              className="driver-btn driver-nav-btn driver-nav-btn-google"
              href={navHref}
              rel="noreferrer"
              target="_blank"
            >
              Open Google Navigation
            </a>
          </div>
        </div>

        <MapLayout
          currentPosition={currentPosition}
          fitPoints={fitPoints}
          mapHeight={compactMapHeight}
          roadPath={roadPath}
          showPosition={Boolean(currentPosition)}
        />
      </div>

      {isExpanded ? (
        <div className="driver-nav-overlay">
          <div className="driver-nav-overlay-header">
            <h2>Live Navigation</h2>
            <div className="driver-nav-actions">
              <a
                className="driver-btn driver-nav-btn driver-nav-btn-google"
                href={navHref}
                rel="noreferrer"
                target="_blank"
              >
                Open Google Navigation
              </a>
              <button
                className="driver-btn driver-nav-btn driver-nav-btn-close"
                onClick={() => setIsExpanded(false)}
                type="button"
              >
                Close
              </button>
            </div>
          </div>

          <div className="driver-nav-vitals driver-nav-vitals-overlay">
            <div>
              <span>Time on road</span>
              <strong>{formatDuration(tripMetrics.durationSec)}</strong>
            </div>
            <div>
              <span>Distance left</span>
              <strong>{formatDistance(tripMetrics.distanceM)}</strong>
            </div>
            <div>
              <span>ETA</span>
              <strong>{etaLabel}</strong>
            </div>
            <div>
              <span>Speed</span>
              <strong>{toFixedSafe(currentSpeedKph, 0)} km/h</strong>
            </div>
            <div>
              <span>GPS Accuracy</span>
              <strong>{toFixedSafe(currentAccuracyM, 0)} m</strong>
            </div>
            <div>
              <span>Bus</span>
              <strong>{assignedBusLabel}</strong>
            </div>
            <div>
              <span>Tracking</span>
              <strong>{trackingStatus || "-"}</strong>
            </div>
            <div>
              <span>Last Sync</span>
              <strong>{lastLocationSyncAt ? lastLocationSyncAt.toLocaleTimeString() : "-"}</strong>
            </div>
          </div>

          <div className="driver-nav-overlay-map">
            <MapLayout
              currentPosition={currentPosition}
              fitPoints={fitPoints}
              mapHeight={fullscreenMapHeight}
              roadPath={roadPath}
              showPosition={Boolean(currentPosition)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

