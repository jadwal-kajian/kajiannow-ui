import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import "./style.scss";

function SwalPopup(data) {
  const { type, info, close } = data;

  if (type == "kajian") {
    return (
      <div className="relative flex flex-col text-center text-base py-2 bg-[#ffe7be] shadow-[inset_0_0_20px_-2px_#000]">
        <div className="title pb-2 font-semibold p-3">{info.topic}</div>
        <div className="content p-3">
          <div className="speaker">{info.speaker}</div>
          <div className="place">{info.loc_name}</div>
          <div className="time">
            {info.time_start} - {info.time_end}
          </div>
          <div className="notes">{info.notes}</div>
        </div>
        <div className="action-area flex gap-2 justify-center items-center p-3 text-sm font-semibold">
          <button
            className="confirm p-2 px-4 rounded-full bg-[#edce93]"
            onClick={() => window.open(info.gmaps_url, "_blank")}
          >
            Buka di Google Maps
          </button>
          <button className="cancel p-2 px-4 rounded-full bg-[#efd8ad] text-sm font-semibold" onClick={close}>
            Tutup
          </button>
        </div>
      </div>
    );
  } else {
    return (
      <div className="relative flex flex-col text-center text-base py-2 bg-[#ffe7be] shadow-[inset_0_0_20px_-2px_#000]">
        <div className="title pb-2 font-semibold p-3">
          <FontAwesomeIcon icon={faInfoCircle} />
          <span className="label mx-2">Petunjuk</span>
        </div>
        <div className="content p-3 max-w-[90%] md:max-w-full mx-auto flex flex-col gap-2 text-sm md:text-base">
          <div className="item-info">
            <FontAwesomeIcon icon={faBook} />
            <span className="desc mx-2">Pinpoint merah menunjukkan lokasi kajian</span>
          </div>
          <div className="item-info">
            <FontAwesomeIcon icon={faBook} />
            <span className="desc mx-2">Klik pinpoint untuk melihat detail info kajian</span>
          </div>
        </div>
        <div className="action-area flex gap-2 justify-center items-center p-3 text-sm font-semibold">
          <button className="cancel p-2 px-4 rounded-full bg-[#efd8ad] text-sm font-semibold" onClick={close}>
            Tutup
          </button>
        </div>
      </div>
    );
  }
}

export default SwalPopup;
