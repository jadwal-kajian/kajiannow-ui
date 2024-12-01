// GoogleMap.js
/* global google */
import React, { useEffect, useRef } from 'react';

function GoogleMap() {
  const mapRef = useRef(null);
//   const position = { lat: 37.4239163, lng: -122.0947209 };
//   Change to jakarta
  const position = { lat: -6.2088, lng: 106.8456 };

  useEffect(() => {
    async function initMap() {
      const { Map } = await google.maps.importLibrary("maps");
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

      const map = new Map(mapRef.current, {
        center: position,
        zoom: 14,
        mapId: "4504f8b37365c3d0",
      });

      // Create custom content with hidden text for hover effect
      const markerContent = document.createElement('div');
      markerContent.innerHTML = `
        <div style="position: relative; display: inline-block;">
          <div style="background-color: #fc0303; color: white; padding: 5px 10px; border-radius: 5px;">
            "Menggapai Jannah dengan Ilmu"
            </br>
            10.00 - 12.00 WIB
          </div>
          <div style="
            visibility: hidden;
            background-color: black;
            color: #fff;
            text-align: center;
            padding: 5px;
            border-radius: 5px;
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            margin-bottom: 10px;
          " class="marker-hover-text">
            Masjid Al Aqsha - Ustadz Syafiq Basalamah
          </div>
        </div>
      `;

      // Add hover effect using JavaScript to toggle visibility on hover
      markerContent.addEventListener('mouseenter', () => {
        markerContent.querySelector('.marker-hover-text').style.visibility = 'visible';
      });

      markerContent.addEventListener('mouseleave', () => {
        markerContent.querySelector('.marker-hover-text').style.visibility = 'hidden';
      });

      // Add custom HTML content to the marker
      const marker = new AdvancedMarkerElement({
        map,
        position,
        content: markerContent,
      });

      marker.addListener('click', () => {
        const url = `https://www.google.com/maps?q=${position.lat},${position.lng}`;
        window.open(url, '_blank');
      });
    }

    initMap();
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '500px' }} />;
}

export default GoogleMap;
