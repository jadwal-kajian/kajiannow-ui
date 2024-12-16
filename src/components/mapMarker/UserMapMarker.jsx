import { MarkerF } from "@react-google-maps/api";
import PropTypes from "prop-types";
import userpinpoint from "assets/icons/userpin.png";

export const UserMapMarker = ({ location }) => {
  return (
    <MarkerF
      position={{ lat: location.lat, lng: location.lng }}
      icon={{
        url: userpinpoint,
        scaledSize: new window.google.maps.Size(40, 40),
      }}
    />
  );
};

UserMapMarker.propTypes = {
  location: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }).isRequired,
};
