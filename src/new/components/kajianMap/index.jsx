import { forwardRef, useImperativeHandle, useRef, useEffect, useMemo, memo } from "react";
import PropTypes from "prop-types";
import { MapContainer, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";

import UserMarker from "./UserMarker";
import KajianMarker from "./KajianMarker";

// Cluster bubble in the same visual language as the kajian pins: teal disc,
// warm-white ring, cheap 3px shadow. Sized up a little as the count grows.
// The count is total KAJIAN (summed from each pin's kajianCount), matching the
// per-pin badge semantics, not just the number of venues.
const clusterIcon = (cluster) => {
  const count = cluster
    .getAllChildMarkers()
    .reduce((n, m) => n + (m.options.kajianCount || 1), 0);
  const size = count < 10 ? 40 : count < 50 ? 46 : 52;
  return divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#0d6b6e;border:3px solid #fffdf8;box-shadow:0 2px 3px rgba(60,40,10,.4);color:#fffdf8;font-weight:800;font-size:${count < 100 ? 14 : 12}px;display:flex;align-items:center;justify-content:center;">${count}</div>`,
    className: "kn-divpin kn-cluster",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
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

      {/* Clustering keeps the mounted-marker count low however far the user
          zooms out, and markercluster only attaches on-screen layers to the
          map — so panning never drags the whole country's pins around. */}
      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        maxClusterRadius={60}
        spiderfyOnMaxZoom
        iconCreateFunction={clusterIcon}
      >
        {groups.map((group) => (
          <KajianMarker
            key={group[0].id ?? `${group[0].lat},${group[0].lng}`}
            location={group[0]}
            group={group}
            showAllInfo={showAllInfo}
          />
        ))}
      </MarkerClusterGroup>
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
