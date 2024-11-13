// GoogleMap.js
import React, { useEffect, useRef } from 'react';
/* global google */
function Map() {
  const mapRef = useRef(null);

  useEffect(() => {
    async function initMap() {
      // Load the required libraries
      const { Map } = await google.maps.importLibrary("maps");
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

      // Initialize the map
      const map = new Map(mapRef.current, {
        center: { lat: 37.4239163, lng: -122.0947209 },
        zoom: 14,
        mapId: "4504f8b37365c3d0",
      });

      // Add a marker
      new AdvancedMarkerElement({
        map,
        position: { lat: 37.4239163, lng: -122.0947209 },
      });
    }

    initMap();
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '500px' }} />;
}

export default Map;
