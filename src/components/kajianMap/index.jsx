import { forwardRef, useImperativeHandle, useRef, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import UserMarker from "./UserMarker";
import KajianMarker from "./KajianMarker";

// Marker status legend (colors mirror STATUS_COLORS in KajianMarker).
const LEGEND_ITEMS = [
  { color: "#16a34a", label: "Berlangsung" },
  { color: "#2563eb", label: "Akan datang" },
  { color: "#9ca3af", label: "Selesai" },
];

function StatusLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-white border border-gray-200 px-2.5 py-2 shadow-md text-[11px] leading-tight text-gray-800 pointer-events-none">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 my-0.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// Use userLocation prop from parent to avoid duplicate geolocation calls
const KajianMap = forwardRef(({ locations, showAllInfo, center, zoom = 12, userLocation }, ref) => {
  const mapInstance = useRef(null);

  // Group kajian by coordinate once (O(n)) and render one marker per location,
  // instead of each marker re-scanning the whole list (O(n²)) and stacking
  // duplicate pins at shared coordinates. Keeps the map snappy with many kajian.
  const groups = useMemo(() => {
    const byKey = new Map();
    for (const loc of locations) {
      if (loc.lat == null || loc.lng == null) continue;
      const key = `${loc.lat},${loc.lng}`;
      const existing = byKey.get(key);
      if (existing) existing.push(loc);
      else byKey.set(key, [loc]);
    }
    return [...byKey.values()];
  }, [locations]);

  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.flyTo(center, zoom);
    }
  }, [center, zoom]);

  useImperativeHandle(
    ref,
    () => ({
      setCenter: (coords) => {
        if (mapInstance.current) {
          mapInstance.current.setView(coords, 12);
        }
      },
    }),
    []
  );

  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
    <MapContainer
      ref={mapInstance}
      style={{
        width: "100%",
        height: "calc(83vh - 185px)",
        borderRadius: 12,
      }}
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userLocation && <UserMarker position={userLocation} />}

      {groups.map((group) => (
        <KajianMarker
          key={group[0].id ?? `${group[0].lat},${group[0].lng}`}
          location={group[0]}
          group={group}
          showAllInfo={showAllInfo}
        />
      ))}
    </MapContainer>
    <StatusLegend />
    </div>
  );
});

KajianMap.displayName = "KajianMap";

KajianMap.propTypes = {
  locations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
      city: PropTypes.string.isRequired,
    })
  ).isRequired,
  showAllInfo: PropTypes.bool,
  center: PropTypes.arrayOf(PropTypes.number).isRequired,
  zoom: PropTypes.number,
  userLocation: PropTypes.arrayOf(PropTypes.number),
};

export default KajianMap;
