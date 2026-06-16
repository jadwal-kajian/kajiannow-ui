import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { MODAL_SHELL, MODAL_TITLE, MODAL_CONTENT } from "./modalStyles";

function LocationLoadingPopup() {
  return (
    <div className={MODAL_SHELL}>
      <div className={MODAL_TITLE}>
        <FontAwesomeIcon icon={faSpinner} spin />
        <span className="label mx-2">Mencari Lokasi</span>
      </div>
      <div className={MODAL_CONTENT}>
        <div className="item-info">
          <span className="desc mx-2">Sedang mencari lokasi Anda...</span>
        </div>
      </div>
    </div>
  );
}

export default LocationLoadingPopup;
