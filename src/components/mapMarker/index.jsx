import { MarkerF, OverlayView } from "@react-google-maps/api";
import PropTypes from "prop-types";
import { groupTopicsByLocation } from "../../utils/helpers";
import { MarkerInfo } from "./MarkerInfo";
import { ShowPopupInfo } from "./ShowPopupInfo";
import { UserMapMarker } from "./UserMapMarker";
import pinpoint from "assets/icons/pinpoint.png";

export const MapMarker = ({ location, showAllInfo, locations }) => {
  const group = groupTopicsByLocation(location.lat, location.lng, locations);

  if (!location.lat && !location.lng) return <></>;

  return (
    <MarkerF
      onClick={() => ShowPopupInfo({ location, group })}
      position={{ lat: location.lat, lng: location.lng }}
      icon={{
        url: pinpoint,
        scaledSize: new window.google.maps.Size(40, 40),
      }}
    >
      {showAllInfo && (
        <OverlayView position={{ lat: location.lat, lng: location.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
          <MarkerInfo group={group} location={location} showAllInfo={showAllInfo} />
        </OverlayView>
      )}
    </MarkerF>
  );
};

MapMarker.propTypes = {
  location: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    topic: PropTypes.string.isRequired,
    speaker: PropTypes.string.isRequired,
    loc_name: PropTypes.string.isRequired,
    time_start: PropTypes.string.isRequired,
    time_end: PropTypes.string.isRequired,
    notes: PropTypes.string,
  }).isRequired,
  showAllInfo: PropTypes.bool.isRequired,
  locations: PropTypes.array.isRequired,
};

export { UserMapMarker };
