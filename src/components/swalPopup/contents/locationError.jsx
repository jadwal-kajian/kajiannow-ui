import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { MODAL_SHELL, MODAL_TITLE, MODAL_CONTENT, MODAL_ACTIONS, BTN_PRIMARY, CloseButton } from "./modalStyles";

function LocationErrorPopup({ message, onRetry, onClose }) {
  return (
    <div className={MODAL_SHELL}>
      <CloseButton onClose={onClose} />
      <div className={MODAL_TITLE}>
        <FontAwesomeIcon icon={faExclamationTriangle} />
        <span className="label mx-2">Gagal mendapatkan lokasi</span>
      </div>
      <div className={MODAL_CONTENT}>
        <div className="item-info">
          <span className="desc mx-2">{message}</span>
        </div>
      </div>
      <div className={MODAL_ACTIONS}>
        <button className={BTN_PRIMARY} onClick={onRetry}>
          Sudah dan coba lagi
        </button>
      </div>
    </div>
  );
}

export default LocationErrorPopup;
