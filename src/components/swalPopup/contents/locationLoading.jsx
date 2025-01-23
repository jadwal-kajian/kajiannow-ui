import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

function LocationLoadingPopup() {
  return (
    <div className="relative flex flex-col text-center text-base py-2 bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]">
      <div className="title pb-2 font-semibold p-3">
        <FontAwesomeIcon icon={faSpinner} spin />
        <span className="label mx-2">Mencari Lokasi</span>
      </div>
      <div className="content p-3 max-w-[90%] md:max-w-full mx-auto flex flex-col gap-2 text-[13px] md:text-base">
        <div className="item-info">
          <span className="desc mx-2">Sedang mencari lokasi Anda...</span>
        </div>
      </div>
    </div>
  );
}

export default LocationLoadingPopup;
