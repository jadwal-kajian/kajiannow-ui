import React from "react";
import { MarkerF, OverlayView } from "@react-google-maps/api";
import pinpoint from "assets/icons/pinpoint.png";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SwalPopup from "components/swalPopup";
import { groupTopicsByLocation } from "../../utils/helpers";

import "./style.scss";

const Popup = withReactContent(Swal);

const MarkerInfo = ({ group, location, showAllInfo }) => {
  const ShowNotes = () => {
    if (location.notes && location.notes !== "Cp : -") {
      return <div className="notes p-2">{location.notes}</div>;
    } else {
      return <></>;
    }
  };

  if (group.length > 1) {
    return group.map((info, i) => {
      // console.log(i, info);
      const x_position = `${i > 1 ? "left-8" : "right-[330px]"}`;
      const y_position = `${i > 1 ? "bottom-[430px]" : "-top-[200px]"}`;

      return (
        <div
          key={i}
          className={`marker-info relative ${x_position} ${y_position} min-w-[300px] flex flex-col mb-2 text-sm text-gray-800 bg-[#ffe7be] shadow-[inset_0_0_20px_-8px_#000] rounded-lg overflow-hidden ${
            showAllInfo ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
          }`}
        >
          <div className="title font-semibold p-2">{info.topic}</div>
          <div className="content p-2">
            <div className="speaker">
              <span className="font-semibold mr-1">Pemateri:</span>
              {info.speaker}
            </div>
            <div className="location">
              <span className="font-semibold mr-1">Tempat:</span>
              {info.loc_name}
            </div>
            <div className="time">
              <span className="font-semibold mr-1">Waktu:</span>
              {info.time_start} - {info.time_end}
            </div>
          </div>
          <ShowNotes />
        </div>
      );
    });
  }

  return (
    <div
      className={`marker-info min-w-[300px] absolute -left-[130px] -bottom-[24px] flex flex-col text-sm text-gray-800 bg-[#ffe7be] shadow-[inset_0_0_20px_-8px_#000] rounded-lg transform -translate-y-1/2 transition-opacity duration-300 overflow-hidden ${
        showAllInfo ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
      }`}
    >
      <div className="title font-semibold p-2">{location.topic}</div>
      <div className="content p-2">
        <div className="speaker">
          <span className="font-semibold mr-1">Pemateri:</span>
          {location.speaker}
        </div>
        <div className="location">
          <span className="font-semibold mr-1">Tempat:</span>
          {location.loc_name}
        </div>
        <div className="time">
          <span className="font-semibold mr-1">Waktu:</span>
          {location.time_start} - {location.time_end}
        </div>
      </div>
      <ShowNotes />
    </div>
  );
};

// Custom Modal to show location details
const ShowPopupInfo = ({ location, group }) => {
  Popup.fire({
    html: <SwalPopup type={"kajian"} info={location} group={group} close={() => Popup.close()} />,
    showConfirmButton: false,
    allowOutsideClick: false,
  });
};

const MapMarker = ({ location, showAllInfo, locations }) => {
  const group = groupTopicsByLocation(location.lat, location.lng, locations);

  return (
    <>
      <MarkerF
        onClick={() => ShowPopupInfo({ location, group })}
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
            <MarkerInfo group={group} location={location} showAllInfo={showAllInfo} />
          </OverlayView>
        )}
      </MarkerF>
    </>
  );
};

export default MapMarker;
