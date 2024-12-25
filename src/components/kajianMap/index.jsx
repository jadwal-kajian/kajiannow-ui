import { forwardRef } from "react";
import PropTypes from "prop-types";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import UserMarker from "./UserMarker";
import KajianMarker from "./KajianMarker";

const KajianMap = forwardRef(({ locations, showAllInfo, center }, ref) => {
  return (
    <div>
      <MapContainer
        ref={ref}
        style={{
          width: "100%",
          height: "calc(80vh - 185px)",
          borderRadius: 12,
          marginBottom: 12,
        }}
        center={center}
        zoom={12}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <UserMarker position={center} />
        {locations.map((location) => (
          <KajianMarker key={location.id} location={location} locations={locations} showAllInfo={showAllInfo} />
        ))}
      </MapContainer>
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
};

export default KajianMap;
