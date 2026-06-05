import PropTypes from "prop-types";
import { Marker, Popup } from "react-leaflet";
import { Icon, divIcon } from "leaflet";

import { ShowPopupInfo } from "./ShowPopupInfo";

import pinpoint from "assets/icons/pinpoint.png";
import { groupTopicsByLocation } from "../../utils/helpers";
import { getGroupStatus } from "../../utils/kajianStatus";
import { MarkerInfo } from "./MarkerInfo";
import { useEffect, useRef } from "react";

// Fallback icon when the status (time) can't be determined.
const defaultIcon = new Icon({
  iconUrl: pinpoint,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Pin color by schedule status.
const STATUS_COLORS = {
  ongoing: "#16a34a", // green — happening now
  upcoming: "#2563eb", // blue — will start later
  passed: "#9ca3af", // gray — already finished
};

const pinSvg = (color, dim) => `
  <div class="kajian-pin-inner">
    <svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
         style="filter: drop-shadow(0 2px 2px rgba(0,0,0,.35));${dim ? "opacity:.7;" : ""}">
      <path d="M12 1C7.6 1 4 4.6 4 9c0 5.4 8 13.5 8 13.5S20 14.4 20 9c0-4.4-3.6-8-8-8z"
            fill="${color}" stroke="#ffffff" stroke-width="1.4"/>
      <circle cx="12" cy="9" r="3" fill="#ffffff"/>
    </svg>
  </div>`;

const iconCache = {};
const getStatusIcon = (status) => {
  const color = STATUS_COLORS[status];
  if (!color) return defaultIcon;
  if (!iconCache[status]) {
    iconCache[status] = divIcon({
      html: pinSvg(color, status === "passed"),
      className: `kajian-pin kajian-pin-${status}`,
      iconSize: [40, 40],
      iconAnchor: [20, 38],
      popupAnchor: [0, -34],
    });
  }
  return iconCache[status];
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
