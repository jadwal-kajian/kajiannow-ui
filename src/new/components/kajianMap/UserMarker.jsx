import PropTypes from "prop-types";
import { Marker } from "react-leaflet";
import { divIcon } from "leaflet";

// Pulsing teal dot for the user's location (matches the design).
const icon = divIcon({
  className: "kn-divpin",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: `<div style="width:22px;height:22px;position:relative;">
    <div style="position:absolute;inset:0;border-radius:50%;background:#0d6b6e;opacity:.35;animation:kn-pulse 2.4s ease-out infinite;"></div>
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:16px;height:16px;border-radius:50%;background:#0d6b6e;border:3px solid #fffdf8;box-shadow:0 2px 6px rgba(0,0,0,.25);"></div>
  </div>`,
});

const UserMarker = ({ position }) => {
  return <Marker position={position} icon={icon} />;
};

UserMarker.displayName = "UserMarker";

UserMarker.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default UserMarker;
