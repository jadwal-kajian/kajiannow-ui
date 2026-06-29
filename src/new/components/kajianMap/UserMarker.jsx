import PropTypes from "prop-types";
import { Marker } from "react-leaflet";
import { divIcon } from "leaflet";

// The user's location: a teal disc with a white person glyph (clearly "you",
// and distinct from the book-glyph kajian pins) plus a soft pulsing ring.
const icon = divIcon({
  className: "kn-divpin",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  html: `<div style="width:40px;height:40px;position:relative;">
    <span style="position:absolute;left:50%;top:50%;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;background:#0d6b6e;opacity:.30;animation:kn-pulse 2.4s ease-out infinite;pointer-events:none;"></span>
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:30px;height:30px;border-radius:50%;background:#0d6b6e;border:3px solid #fffdf8;box-shadow:0 3px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="#fffdf8"><circle cx="12" cy="7.5" r="3.6"></circle><path d="M5.5 19.5c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6z"></path></svg>
    </div>
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
