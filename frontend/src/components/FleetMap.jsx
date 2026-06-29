// Shared fleet map for corridor monitoring.
// Renders the fixed launch route, stops, and live bus or
// driver activity on the Lagos operating corridor.
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import api from "../api/api";

const IYANA_IBA = [6.463611, 3.204917];
const EGBEDA = [6.599194, 3.291361];
const FOCUS_POINTS = [IYANA_IBA, EGBEDA];
const FORWARD_ROUTE_URL = `https://router.project-osrm.org/route/v1/driving/${IYANA_IBA[1]},${IYANA_IBA[0]};${EGBEDA[1]},${EGBEDA[0]}?overview=full&geometries=geojson`;
const REVERSE_ROUTE_URL = `https://router.project-osrm.org/route/v1/driving/${EGBEDA[1]},${EGBEDA[0]};${IYANA_IBA[1]},${IYANA_IBA[0]}?overview=full&geometries=geojson`;
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const MAX_DISTANCE_FROM_CORRIDOR_METERS = 220;

const fallbackStops = [
  { name: "Iyana-Iba Bus Stop", position: IYANA_IBA, note: "Terminal" },
  { name: "LASU Gate", position: [6.4679, 3.2014], note: "Landmark" },
  { name: "Volks Bus Stop", position: [6.5053, 3.2438], note: "Bus stop" },
  { name: "Iyana School Bus Stop", position: [6.5438, 3.2647], note: "Bus stop" },
  { name: "Idimu Bus Stop", position: [6.5748, 3.2775], note: "Bus stop" },
  { name: "Egbeda Bus Stop", position: EGBEDA, note: "Terminal" },
];

const toXYMeters = ([lat, lng]) => {
  const latFactor = 111320;
  const lngFactor = 111320 * Math.cos((lat * Math.PI) / 180);
  return [lng * lngFactor, lat * latFactor];
};

const pointToSegmentDistanceMeters = (point, start, end) => {
  const [px, py] = toXYMeters(point);
  const [ax, ay] = toXYMeters(start);
  const [bx, by] = toXYMeters(end);

  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
};

const minDistanceToPolylineMeters = (point, polyline) => {
  if (polyline.length < 2) return Infinity;

  let minDistance = Infinity;
  for (let i = 0; i < polyline.length - 1; i += 1) {
    const distance = pointToSegmentDistanceMeters(point, polyline[i], polyline[i + 1]);
    if (distance < minDistance) minDistance = distance;
  }

  return minDistance;
};

const findNearestSegmentIndex = (point, polyline) => {
  if (polyline.length < 2) return 0;

  let nearestIndex = 0;
  let minDistance = Infinity;

  for (let i = 0; i < polyline.length - 1; i += 1) {
    const distance = pointToSegmentDistanceMeters(point, polyline[i], polyline[i + 1]);
    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = i;
    }
  }

  return nearestIndex;
};

const fetchCorridorStops = async (polyline) => {
  if (polyline.length < 2) return [];

  const lats = polyline.map((point) => point[0]);
  const lngs = polyline.map((point) => point[1]);
  const paddingDeg = 0.01;

  const south = Math.min(...lats) - paddingDeg;
  const north = Math.max(...lats) + paddingDeg;
  const west = Math.min(...lngs) - paddingDeg;
  const east = Math.max(...lngs) + paddingDeg;

  const query = `
[out:json][timeout:30];
(
  node["highway"="bus_stop"](${south},${west},${north},${east});
  node["public_transport"="platform"](${south},${west},${north},${east});
);
out body;
  `.trim();

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: query,
  });
  if (!response.ok) throw new Error("Failed to fetch bus stops from Overpass");

  const data = await response.json();
  const rawStops = (data.elements || [])
    .filter((item) => item?.lat != null && item?.lon != null && item?.tags?.name)
    .map((item) => ({
      id: item.id,
      name: item.tags.name,
      position: [Number(item.lat), Number(item.lon)],
      tags: item.tags,
    }));

  const byName = new Map();
  rawStops.forEach((stop) => {
    const key = stop.name.toLowerCase().trim();
    if (!byName.has(key)) byName.set(key, stop);
  });

  const corridorStops = Array.from(byName.values())
    .map((stop) => ({
      ...stop,
      distanceMeters: minDistanceToPolylineMeters(stop.position, polyline),
    }))
    .filter((stop) => stop.distanceMeters <= MAX_DISTANCE_FROM_CORRIDOR_METERS)
    .sort((a, b) => findNearestSegmentIndex(a.position, polyline) - findNearestSegmentIndex(b.position, polyline))
    .slice(0, 16)
    .map((stop) => ({
      name: stop.name,
      position: stop.position,
      note: `${Math.round(stop.distanceMeters)}m from corridor`,
    }));

  return corridorStops;
};

function FocusRouteBounds() {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(FOCUS_POINTS, { padding: [40, 40] });
  }, [map]);

  return null;
}

const markerOffset = (index) => {
  const drift = (index % 4) * 0.0016;
  return [drift, -drift * 0.8];
};

export default function FleetMap() {
  const [buses, setBuses] = useState([]);
  const [forwardRoadPath, setForwardRoadPath] = useState([IYANA_IBA, EGBEDA]);
  const [reverseRoadPath, setReverseRoadPath] = useState([EGBEDA, IYANA_IBA]);
  const [corridorStops, setCorridorStops] = useState(fallbackStops);
  const [liveDrivers, setLiveDrivers] = useState([]);

  useEffect(() => {
    api
      .get("/buses")
      .then((busesRes) => {
        setBuses(busesRes.data);
      })
      .catch(() => {
        setBuses([]);
      });
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadLiveDrivers = async () => {
      try {
        const res = await api.get("/tracking/live");
        if (!isCancelled) setLiveDrivers(res.data || []);
      } catch {
        if (!isCancelled) setLiveDrivers([]);
      }
    };

    loadLiveDrivers();
    const timer = setInterval(loadLiveDrivers, 15000);

    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const fetchRoadRoute = async (url, fallback, setter) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch route geometry");
        const data = await response.json();
        const coordinates = data?.routes?.[0]?.geometry?.coordinates;
        if (!coordinates?.length) throw new Error("No road route found");
        setter(coordinates.map(([lng, lat]) => [lat, lng]));
      } catch {
        setter(fallback);
      }
    };

    fetchRoadRoute(FORWARD_ROUTE_URL, [IYANA_IBA, EGBEDA], setForwardRoadPath);
    fetchRoadRoute(REVERSE_ROUTE_URL, [EGBEDA, IYANA_IBA], setReverseRoadPath);
  }, []);

  useEffect(() => {
    fetchCorridorStops(forwardRoadPath)
      .then((stops) => {
        if (stops.length > 0) {
          const includesStart = stops.some((stop) => stop.name.toLowerCase().includes("iyana"));
          const includesEnd = stops.some((stop) => stop.name.toLowerCase().includes("egbeda"));

          const mergedStops = [...stops];
          if (!includesStart) {
            mergedStops.unshift({ name: "Iyana-Iba Bus Stop", position: IYANA_IBA, note: "Terminal" });
          }
          if (!includesEnd) {
            mergedStops.push({ name: "Egbeda Bus Stop", position: EGBEDA, note: "Terminal" });
          }

          setCorridorStops(mergedStops);
          return;
        }

        setCorridorStops(fallbackStops);
      })
      .catch(() => {
        setCorridorStops(fallbackStops);
      });
  }, [forwardRoadPath]);

  const busesInUse = useMemo(() => {
    const active = buses.filter((bus) => bus.status === "ACTIVE");
    return active.length > 0 ? active : buses;
  }, [buses]);

  const routeMidPoint = [(IYANA_IBA[0] + EGBEDA[0]) / 2, (IYANA_IBA[1] + EGBEDA[1]) / 2];

  return (
    <MapContainer center={routeMidPoint} zoom={12} style={{ height: "500px", width: "100%" }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FocusRouteBounds />

      {corridorStops.map((stop) => (
        <Marker key={stop.name} position={stop.position}>
          <Popup>
            <strong>{stop.name}</strong>
            <br />
            {stop.note}
          </Popup>
        </Marker>
      ))}

      <Polyline pathOptions={{ color: "#0f9b6d", weight: 7, opacity: 0.95 }} positions={forwardRoadPath}>
        <Popup>
          <strong>Route in Use</strong>
          <br />
          Iyana-Iba to Egbeda
        </Popup>
      </Polyline>

      <Polyline
        pathOptions={{ color: "#0f9b6d", weight: 5, opacity: 0.65, dashArray: "8 10" }}
        positions={reverseRoadPath}
      >
        <Popup>
          <strong>Return Route</strong>
          <br />
          Egbeda to Iyana-Iba
        </Popup>
      </Polyline>

      {busesInUse.map((bus, index) => {
        const anchor = routeMidPoint;
        const offset = markerOffset(index);
        const position = [anchor[0] + offset[0], anchor[1] + offset[1]];

        return (
          <Marker key={bus.id} position={position}>
            <Popup>
              <strong>{bus.plateNumber}</strong>
              <br />
              Iyana-Iba {"<->"} Egbeda
              <br />
              Status: {bus.status}
            </Popup>
          </Marker>
        );
      })}

      {liveDrivers.map((item) => (
        <Marker key={item.userId} position={[item.lat, item.lng]}>
          <Popup>
            <strong>{item.user?.name || "Driver"}</strong>
            <br />
            {item.user?.phone || "-"}
            <br />
            Speed: {item.speedKph == null ? "-" : `${Math.round(item.speedKph)} km/h`}
            <br />
            Updated: {new Date(item.recordedAt).toLocaleTimeString()}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

