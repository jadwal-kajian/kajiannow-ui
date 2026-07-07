import { forwardRef, useImperativeHandle, useRef, useEffect, useMemo, useState, memo } from "react";
import PropTypes from "prop-types";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import UserMarker from "./UserMarker";
import KajianMarker from "./KajianMarker";

// Pad the culling window by half a viewport on every side so pins slide into
// view mid-pan instead of popping in right at the edge.
const BOUNDS_PAD = 0.5;

// Mount only the markers inside the current (padded) viewport. Each kajian pin
// is a multi-element divIcon with blurred shadows that the browser has to move
// on every drag frame, so mounting the whole country while the user looks at
// one city makes panning visibly laggy. moveend fires once per completed
// drag/zoom/flyTo — the cull is one O(n) pass per interaction, not per frame.
function VisibleMarkers({ groups, showAllInfo }) {
  const map = useMap();
  const [bounds, setBounds] = useState(() => map.getBounds().pad(BOUNDS_PAD));
  const update = () => setBounds(map.getBounds().pad(BOUNDS_PAD));
  useMapEvents({ moveend: update, resize: update });

  const visible = useMemo(
    () => groups.filter((group) => bounds.contains([group[0].lat, group[0].lng])),
    [groups, bounds]
  );

  return visible.map((group) => (
    <KajianMarker
      key={group[0].id ?? `${group[0].lat},${group[0].lng}`}
      location={group[0]}
      group={group}
      showAllInfo={showAllInfo}
    />
  ));
}

VisibleMarkers.propTypes = {
  groups: PropTypes.array.isRequired,
  showAllInfo: PropTypes.bool,
};

// Use userLocation prop from parent to avoid duplicate geolocation calls
const KajianMap = forwardRef(({ locations, showAllInfo, center, zoom = 12, userLocation }, ref) => {
  const mapInstance = useRef(null);

  // Group kajian by coordinate once (O(n)) and render one marker per location,
  // instead of each marker re-scanning the whole list (O(n²)) and stacking
  // duplicate pins at shared coordinates. Keeps the map snappy with many kajian.
  const groups = useMemo(() => {
    const byKey = new Map();
    for (const loc of locations) {
      if (loc.lat == null || loc.lng == null) continue;
      const key = `${loc.lat},${loc.lng}`;
      const existing = byKey.get(key);
      if (existing) existing.push(loc);
      else byKey.set(key, [loc]);
    }
    return [...byKey.values()];
  }, [locations]);

  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.flyTo(center, zoom);
    }
  }, [center, zoom]);

  useImperativeHandle(
    ref,
    () => ({
      setCenter: (coords) => {
        if (mapInstance.current) {
          mapInstance.current.setView(coords, 12);
        }
      },
    }),
    []
  );

  return (
    <MapContainer
      ref={mapInstance}
      style={{ width: "100%", height: "100%" }}
      center={center}
      zoom={zoom}
      zoomControl={false}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userLocation && <UserMarker position={userLocation} />}

      <VisibleMarkers groups={groups} showAllInfo={showAllInfo} />
    </MapContainer>
  );
});

KajianMap.displayName = "KajianMap";

KajianMap.propTypes = {
  locations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
      city: PropTypes.string.isRequired,
    })
  ).isRequired,
  showAllInfo: PropTypes.bool,
  center: PropTypes.arrayOf(PropTypes.number).isRequired,
  zoom: PropTypes.number,
  userLocation: PropTypes.arrayOf(PropTypes.number),
};

// memo: Home re-renders often while its overlays animate (e.g. every pointermove
// of the bottom-sheet drag). With stable center/userLocation identities from
// Home, those re-renders skip the map subtree entirely.
export default memo(KajianMap);
