import { forwardRef, useImperativeHandle, useRef } from "react";
import PropTypes from "prop-types";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import UserMarker from "./UserMarker";
import KajianMarker from "./KajianMarker";
import { useEffect } from "react";

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
          console.log("Setting center to:", coords);
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

      {locations.map((location) => (
        <KajianMarker key={location.id} location={location} locations={locations} showAllInfo={showAllInfo} />
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
