import { forwardRef, useImperativeHandle, useRef } from "react";
import PropTypes from "prop-types";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import UserMarker from "./UserMarker";
import KajianMarker from "./KajianMarker";
import { useEffect, useState } from "react";

const KajianMap = forwardRef(({ locations, showAllInfo, center }, ref) => {
  const mapInstance = useRef(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.flyTo(center, 12);
    }
  }, [center]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting current location:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      setCenter: (coords) => {
        if (mapInstance.current) {
          console.log("Setting center to:", coords);
          mapInstance.current.setView(coords, 12);
        }
      },
    }),
    []
  );

  return (
    <MapContainer
      ref={mapInstance}
      style={{
        width: "100%",
        height: "calc(80vh - 185px)",
        borderRadius: 12,
        marginBottom: 12,
      }}
      center={center}
      zoom={12}
      scrollWheelZoom={true}
      eventHandlers={{
        locationfound: (e) => {
          setUserLocation([e.latlng.lat, e.latlng.lng]);
        },
        locationerror: (e) => {
          console.error("Error getting user location:", e);
        },
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userLocation && <UserMarker position={userLocation} />}

      {locations.map((location) => (
        <KajianMarker key={location.id} location={location} locations={locations} showAllInfo={showAllInfo} />
      ))}
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
};

export default KajianMap;
