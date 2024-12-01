import React, { useEffect, useState } from "react";
import { MarkerF, InfoWindow } from "@react-google-maps/api";
import pinpoint from "assets/icons/pinpoint.png";
import Swal from "sweetalert2";
import "./style.scss";

const MarkerInfo = ({ location, showAllInfo }) => (
  <div className="marker-container">
    <div className="marker-dot"></div>
    <div className="marker-info" style={{ visibility: showAllInfo ? "visible" : "hidden" }}>
      <strong>{location.topic}</strong>
      <br />
      {location.time_start} - {location.time_end}
      <br />
      {location.loc_name} - {location.speaker}
      <br />
      {location.notes}
    </div>
  </div>
);

// Custom Modal to show location details
const ShowPopupInfo = ({ location, onClose }) => {
  Swal.fire({
    html: `
      <div style="display: flex; flex-direction: column; gap: 6px; text-align: left;">
        <div className="title">${location.topic}</div>
        <div className="time">${location.time_start} - ${location.time_end}</div>
        <div className="place">${location.loc_name}</div>
        <div className="speaker">${location.speaker}</div>
        <div className="notes">${location.notes}</div>
      </div>
    `,
    icon: "info",
    showCancelButton: true,
    confirmButtonText: "Buka di Google Maps",
    cancelButtonText: "Syukron",
    preConfirm: () => {
      window.open(location.gmaps_url, "_blank"); // Open Google Maps URL on confirm
    },
  });
};

export const MarkerWithInfo = ({ location, showAllInfo }) => {
  const [isInfoVisible, setIsInfoVisible] = useState(false);

  // Effect for synchronizing InfoWindow visibility with showAllInfo
  useEffect(() => {
    if (!showAllInfo) {
      setIsInfoVisible(false); // Close InfoWindow when showAllInfo is false
    } else {
      setIsInfoVisible(true); // Open InfoWindow when showAllInfo is true
    }
  }, [showAllInfo]);

  return (
    <>
      <MarkerF
        onClick={() => ShowPopupInfo({ location })}
        position={{ lat: location.lat, lng: location.lng }}
        icon={{
          url: pinpoint,
          scaledSize: new window.google.maps.Size(40, 40),
        }}
      >
        {isInfoVisible && (
          <InfoWindow position={{ lat: location.lat, lng: location.lng }} onCloseClick={() => setIsInfoVisible(false)}>
            <MarkerInfo location={location} showAllInfo={showAllInfo} />
          </InfoWindow>
        )}
      </MarkerF>
    </>
  );
};
