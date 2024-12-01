// GoogleMap.js
/* global google */
import React, { useEffect, useRef } from 'react';

function GoogleMap({ locations }) {
  const mapRef = useRef(null);

  useEffect(() => {
    async function initMap() {
      const { Map } = await google.maps.importLibrary("maps");
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

      const map = new Map(mapRef.current, {
        center: { lat: -6.2088, lng: 106.8456 },
        zoom: 12,
        mapId: "4504f8b37365c3d0",
      });

      locations.forEach(location => {
        const markerContent = document.createElement('div');
        markerContent.innerHTML = `
          <div style="position: relative; display: inline-block;">
            <div style="
              width: 10px;
              height: 10px;
              background-color: red;
              border-radius: 50%;
              position: absolute;
              bottom: 0;
              left: 50%;
              transform: translateX(-50%);
              z-index: 1;
            "></div>
            <div style="
              visibility: hidden;
              background-color: #fc0303;
              color: white;
              padding: 5px 10px;
              border-radius: 5px;
              position: absolute;
              bottom: 100%;
              left: 50%;
              transform: translateX(-50%);
              white-space: nowrap;
              margin-bottom: 10px;
              z-index: 2;
            " class="marker-hover-text">
              ${location.topic}
              </br>
              ${location.time_start} - ${location.time_end}
              </br>
              ${location.loc_name} - ${location.speaker}
              </br>
              ${location.notes}
            </div>
          </div>
        `;

        markerContent.addEventListener('mouseenter', () => {
          markerContent.querySelector('.marker-hover-text').style.visibility = 'visible';
        });

        markerContent.addEventListener('mouseleave', () => {
          markerContent.querySelector('.marker-hover-text').style.visibility = 'hidden';
        });

        const marker = new AdvancedMarkerElement({
          map,
          position: { lat: location.lat, lng: location.lng },
          content: markerContent,
        });

        marker.addListener('click', () => {
          const confirmOpen = window.confirm(
            `Judul: ${location.topic}\n` +
            `Waktu: ${location.time_start} - ${location.time_end}\n` +
            `Lokasi: ${location.loc_name}\n` +
            `Pembicara: ${location.speaker}\n\n` +
            `Catatan: ${location.notes}\n\n` +
            `Apakah Anda mau buka lokasi kajian ini di Google Maps?`
          );
          if (confirmOpen) {
            window.open(location.gmaps_url, '_blank');
          }
        });
      });
    }

    initMap();
  }, [locations]);

  return <div ref={mapRef} style={{ width: '100%', height: '500px' }} />;
}

export default GoogleMap;
