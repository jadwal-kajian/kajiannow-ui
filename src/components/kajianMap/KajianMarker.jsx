import PropTypes from "prop-types";
import { Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";

import { ShowPopupInfo } from "./ShowPopupInfo";

import pinpoint from "assets/icons/pinpoint.png";
import { groupTopicsByLocation } from "../../utils/helpers";
import { getGroupStatus } from "../../utils/kajianStatus";
import { MarkerInfo } from "./MarkerInfo";
import { useEffect, useRef } from "react";

// Same book-pin image, tinted per status via a CSS class (see index.css).
// `null` status (time unknown) keeps the original untinted pin.
const iconCache = {};
const getStatusIcon = (status) => {
  const key = status || "unknown";
  if (!iconCache[key]) {
    iconCache[key] = new Icon({
      iconUrl: pinpoint,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -36],
      className: status ? `kajian-pin kajian-pin-${status}` : "kajian-pin",
    });
  }
  return iconCache[key];
};

const KajianMarker = ({ location, locations, showAllInfo }) => {
  const markerRef = useRef(null);
  const group = groupTopicsByLocation(location.lat, location.lng, locations);
  const markerIcon = getStatusIcon(getGroupStatus(group));

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
      icon={markerIcon}
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
