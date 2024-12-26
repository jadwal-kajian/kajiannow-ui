import PropTypes from "prop-types";
import { Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";

import { ShowPopupInfo } from "./ShowPopupInfo";

import pinpoint from "assets/icons/pinpoint.png";
import { groupTopicsByLocation } from "../../utils/helpers";
import { MarkerInfo } from "./MarkerInfo";
import { useEffect, useRef } from "react";

const icon = new Icon({
  iconUrl: pinpoint,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const KajianMarker = ({ location, locations, showAllInfo }) => {
  const markerRef = useRef(null);
  const group = groupTopicsByLocation(location.lat, location.lng, locations);

  useEffect(() => {
    if (markerRef.current) {
      if (showAllInfo) {
        markerRef.current.openPopup();
        return;
      }
      markerRef.current.closePopup();
    }
  }, [showAllInfo]);

  if (!location.lat && !location.lng) return null;

  return (
    <Marker
      ref={markerRef}
      position={[location.lat, location.lng]}
      icon={icon}
      eventHandlers={{
        click: () => ShowPopupInfo({ location, group }),
      }}
    >
      <Popup autoPan={false} closeButton={false} offset={[0, -20]} autoClose={false} className="custom-leaflet-popup">
        {showAllInfo && <MarkerInfo group={group} location={location} showAllInfo={showAllInfo} />}
      </Popup>
    </Marker>
  );
};

KajianMarker.displayName = "KajianMarker";

KajianMarker.propTypes = {
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

export default KajianMarker;
