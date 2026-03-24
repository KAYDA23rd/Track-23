import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";

const IYANA_IBA = [6.463611, 3.204917];
const EGBEDA = [6.599194, 3.291361];
const FORWARD_ROUTE_URL = `https://router.project-osrm.org/route/v1/driving/${IYANA_IBA[1]},${IYANA_IBA[0]};${EGBEDA[1]},${EGBEDA[0]}?overview=full&geometries=geojson`;
const REVERSE_ROUTE_URL = `https://router.project-osrm.org/route/v1/driving/${EGBEDA[1]},${EGBEDA[0]};${IYANA_IBA[1]},${IYANA_IBA[0]}?overview=full&geometries=geojson`;

const corridorStops = [
  { name: "Iyana-Iba Bus Stop", position: IYANA_IBA, note: "Terminal" },
  { name: "LASU Gate", position: [6.4679, 3.2014], note: "Major landmark" },
  { name: "Volks Bus Stop", position: [6.5053, 3.2438], note: "Bus stop" },
  { name: "Iyana School Bus Stop", position: [6.5438, 3.2647], note: "Bus stop" },
  { name: "Idimu Bus Stop", position: [6.5748, 3.2775], note: "Bus stop" },
  { name: "Egbeda Bus Stop", position: EGBEDA, note: "Terminal" },
];

function FitFocusBounds() {
  const map = useMap();

  useEffect(() => {
    map.fitBounds([IYANA_IBA, EGBEDA], { padding: [40, 40] });
  }, [map]);

  return null;
}

export default function Map() {
  const [forwardRoadPath, setForwardRoadPath] = useState([IYANA_IBA, EGBEDA]);
  const [reverseRoadPath, setReverseRoadPath] = useState([EGBEDA, IYANA_IBA]);

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

  return (
    <MapContainer
      center={[6.55375, 3.24095]}
      zoom={12}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitFocusBounds />
      {corridorStops.map((stop) => (
        <Marker key={stop.name} position={stop.position}>
          <Popup>
            <strong>{stop.name}</strong>
            <br />
            {stop.note}
          </Popup>
        </Marker>
      ))}

      <Polyline pathOptions={{ color: "#0f9b6d", weight: 7 }} positions={forwardRoadPath}>
        <Popup>Iyana-Iba to Egbeda</Popup>
      </Polyline>
      <Polyline
        pathOptions={{ color: "#0f9b6d", weight: 5, dashArray: "8 10", opacity: 0.65 }}
        positions={reverseRoadPath}
      >
        <Popup>Egbeda to Iyana-Iba</Popup>
      </Polyline>
      <Marker position={[6.55375, 3.24095]}>
        <Popup>Track 23 Bus Location (corridor midpoint)</Popup>
      </Marker>
    </MapContainer>
  );
}
