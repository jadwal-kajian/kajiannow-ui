import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faInfoCircle } from "@fortawesome/free-solid-svg-icons";

function PetunjukPopup({ close }) {
  return (
    <div className="relative flex flex-col text-center text-base py-2 bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]">
      <div className="title pb-2 font-semibold p-3">
        <FontAwesomeIcon icon={faInfoCircle} />
        <span className="label mx-2">Petunjuk</span>
      </div>
      <div className="content p-3 max-w-[90%] md:max-w-full mx-auto flex flex-col gap-2 text-[13px] md:text-base">
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

export default PetunjukPopup;
