import PropTypes from "prop-types";
import { Marker } from "react-leaflet";
import userpin from "assets/icons/userpin.png";
import { Icon } from "leaflet";

const icon = new Icon({
  iconUrl: userpin,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const UserMarker = ({ position }) => {
  return <Marker position={position} icon={icon} />;
};

UserMarker.displayName = "UserMarker";

UserMarker.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default UserMarker;
