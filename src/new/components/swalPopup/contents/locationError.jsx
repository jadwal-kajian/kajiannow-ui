import React from "react";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { MODAL_SHELL, MODAL_CONTENT, MODAL_ACTIONS, BTN_PRIMARY, ModalHeader, CloseButton } from "./modalStyles";

function LocationErrorPopup({ message, onRetry, onClose }) {
  return (
    <div className={MODAL_SHELL}>
      <CloseButton onClose={onClose} />
      <ModalHeader icon={faLocationDot} title="Gagal mendapatkan lokasi" danger />
      <div className={MODAL_CONTENT}>
        <p className="text-center text-ink">{message}</p>
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
