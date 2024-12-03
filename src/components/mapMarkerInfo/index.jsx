import React, { useEffect, useState } from "react";
import { MarkerF, OverlayView } from "@react-google-maps/api";
import pinpoint from "assets/icons/pinpoint.png";
import Swal from "sweetalert2";
import "./style.scss";

const MarkerInfo = ({ location, showAllInfo }) => {
  const ShowNotes = () => {
    if (location.notes && location.notes !== "Cp : -") {
      return <div className="notes bg-[#9fcaf3] p-2">{location.notes}</div>;
    } else {
      return <></>;
    }
  };

  return (
    <div
      className={`marker-info min-w-[300px] absolute -left-[130px] -bottom-[24px] flex flex-col text-sm text-gray-800 bg-white rounded-lg shadow-lg transform -translate-y-1/2 transition-opacity duration-300 overflow-hidden ${
        showAllInfo ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
      }`}
    >
      <div className="title font-semibold bg-[#87cefa] p-2">{location.topic}</div>
      <div className="content bg-[#b3d9ff] p-2">
        <div className="speaker">
          <span className="font-semibold mr-1">Pemateri:</span>
          {location.speaker}
        </div>
        <div className="time">
          <span className="font-semibold mr-1">Waktu:</span>
          {location.time_start} - {location.time_end}
        </div>
        <div className="location">
          <span className="font-semibold mr-1">Tempat:</span>
          {location.loc_name}
        </div>
      </div>
      <ShowNotes />
    </div>
  );
};

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
  console.log(location);

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
        {showAllInfo && (
          <OverlayView
            position={{ lat: location.lat, lng: location.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <MarkerInfo location={location} showAllInfo={showAllInfo} />
          </OverlayView>
        )}
      </MarkerF>
    </>
  );
};
