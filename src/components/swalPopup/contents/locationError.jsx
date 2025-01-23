import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

function LocationErrorPopup({ message, onRetry, onClose }) {
  return (
    <div className="relative flex flex-col text-center text-base py-2 bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]">
      <div className="title pb-2 font-semibold p-3">
        <FontAwesomeIcon icon={faExclamationTriangle} />
        <span className="label mx-2">Gagal mendapatkan lokasi</span>
      </div>
      <div className="content p-3 max-w-[90%] md:max-w-full mx-auto flex flex-col gap-2 text-[13px] md:text-base">
        <div className="item-info">
          <span className="desc mx-2">{message}</span>
        </div>
      </div>
      <div className="action-area flex gap-2 justify-center items-center p-3 text-sm font-semibold">
        <button className="retry p-2 px-4 rounded-full bg-[#efd8ad] text-sm font-semibold" onClick={onRetry}>
          Sudah dan coba lagi
        </button>
        <button className="close p-2 px-4 rounded-full bg-[#efd8ad] text-sm font-semibold" onClick={onClose}>
          Tutup
        </button>
      </div>
    </div>
  );
}

export default LocationErrorPopup;
