import PropTypes from "prop-types";
import { Marker, Popup } from "react-leaflet";
import { divIcon } from "leaflet";

import { ShowPopupInfo } from "./ShowPopupInfo";
import { getGroupStatus } from "../../utils/kajianStatus";
import { MarkerInfo } from "./MarkerInfo";
import { useEffect, useMemo, useRef } from "react";

// Status → pin color (map tiles are always light, so these are fixed, not themed).
const PIN_COLOR = {
  ongoing: "#1f8a5b",
  upcoming: "#2f6fb0",
  passed: "#8a8478",
};
const colorFor = (status) => PIN_COLOR[status] || "#8a8478";

// Mosque glyph used inside the pin.
const mosque = (c) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V11l7-5 7 5v10"></path><path d="M9 21v-5h6v5"></path><path d="M12 6V3"></path></svg>`;

// Circular white pin with a mosque + status ring, a pointer tail, and a teal
// count badge when several kajian share the spot. Matches the design markers.
const iconCache = {};
const getPinIcon = (status, count) => {
  const key = `${status || "unknown"}|${count}`;
  if (!iconCache[key]) {
    const c = colorFor(status);
    const badge =
      count > 1
        ? `<div style="position:absolute;top:-7px;right:-9px;min-width:21px;height:21px;padding:0 5px;border-radius:11px;background:#0d6b6e;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #fffdf8;">${count}</div>`
        : "";
    const html = `<div style="position:relative;width:44px;display:flex;flex-direction:column;align-items:center;">
      <div style="width:44px;height:44px;border-radius:50%;background:#fffdf8;border:3px solid ${c};box-shadow:0 7px 16px -5px rgba(60,40,10,.45);display:flex;align-items:center;justify-content:center;position:relative;">
        ${mosque(c)}${badge}
      </div>
      <div style="width:11px;height:11px;background:#fffdf8;border-right:3px solid ${c};border-bottom:3px solid ${c};transform:rotate(45deg);margin-top:-6px;"></div>
    </div>`;
    iconCache[key] = divIcon({
      html,
      // Keep `kajian-pin` (used by e2e selectors) alongside the divIcon reset class.
      className: "kn-divpin kajian-pin",
      iconSize: [44, 58],
      iconAnchor: [22, 56],
      popupAnchor: [0, -52],
    });
  }
  return iconCache[key];
};

const KajianMarker = ({ location, group, showAllInfo }) => {
  const markerRef = useRef(null);
  // `group` (all kajian at this coordinate) is precomputed once by KajianMap.
  const markerIcon = useMemo(() => getPinIcon(getGroupStatus(group), group.length), [group]);

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
  group: PropTypes.array.isRequired,
};

export default KajianMarker;
