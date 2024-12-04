import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import { MarkerWithInfo } from "components/mapMarkerInfo";

const KajianMap = forwardRef(({ locations, center = { lat: -6.2088, lng: 106.8456 }, showAllInfo }, ref) => {
  const mapInstance = useRef(null);

  // Menyediakan API untuk mengatur pusat peta dari komponen induk
  useImperativeHandle(ref, () => ({
    setCenter: (coords) => mapInstance.current?.panTo(coords),
  }));

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "calc(100vh - 300px)", borderRadius: 12, marginBottom: 12 }}
        center={center}
        zoom={12}
        onLoad={(map) => (mapInstance.current = map)}
        onUnmount={() => (mapInstance.current = null)}
        options={{
          mapId: "4504f8b37365c3d0",
          disableDefaultUI: false, // Set to true to hide all controls
          mapTypeControl: false, // Hides the satellite button
          zoomControl: true, // Keeps the zoom controls visible
          streetViewControl: false, // Hides the street view pegman
        }}
      >
        {locations.map((location, index) => (
          <MarkerWithInfo
            key={location.id || `${location.lat}-${location.lng}-${index}`}
            location={location}
            locations={locations}
            showAllInfo={showAllInfo}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
});

export default KajianMap;
