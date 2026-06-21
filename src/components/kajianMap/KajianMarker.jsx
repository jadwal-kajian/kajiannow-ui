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

// Open-Qur'an (book) glyph used inside the pin.
const quran = (c) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5.5C6.5 4.8 9.5 5.2 12 7c2.5-1.8 5.5-2.2 9-1.5v12.5c-3.5-.7-6.5-.3-9 1.5-2.5-1.8-5.5-2.2-9-1.5z"></path><path d="M12 7v12.5"></path></svg>`;

// Circular white pin with the Qur'an glyph + status ring, a pointer tail, and a
// teal count badge when several kajian share the spot. A soft status-colored
// glow pulses behind it (opacity/transform only — GPU-composited, cheap).
const iconCache = {};
const getPinIcon = (status, count) => {
  const key = `${status || "unknown"}|${count}`;
  if (!iconCache[key]) {
    const c = colorFor(status);
    const badge =
      count > 1
        ? `<div style="position:absolute;top:-7px;right:-9px;min-width:21px;height:21px;padding:0 5px;border-radius:11px;background:#0d6b6e;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #fffdf8;z-index:2;">${count}</div>`
        : "";
    const html = `<div style="position:relative;width:44px;display:flex;flex-direction:column;align-items:center;">
      <div style="position:relative;width:44px;height:44px;">
        <span style="position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:${c};animation:kn-glow 2.8s ease-in-out infinite;pointer-events:none;"></span>
        <div style="position:relative;z-index:1;width:44px;height:44px;border-radius:50%;background:#fffdf8;border:3px solid ${c};box-shadow:0 7px 16px -5px rgba(60,40,10,.45);display:flex;align-items:center;justify-content:center;">
          ${quran(c)}${badge}
        </div>
      </div>
      <div style="position:relative;z-index:1;width:11px;height:11px;background:#fffdf8;border-right:3px solid ${c};border-bottom:3px solid ${c};transform:rotate(45deg);margin-top:-6px;"></div>
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
