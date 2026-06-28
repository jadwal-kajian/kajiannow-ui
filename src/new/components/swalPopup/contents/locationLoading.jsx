import React from "react";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { MODAL_SHELL, ModalHeader } from "./modalStyles";

function LocationLoadingPopup() {
  return (
    <div className={MODAL_SHELL}>
      <ModalHeader icon={faSpinner} title="Mencari Lokasi" subtitle="Sedang mencari lokasi Anda…" spin />
      <div className="pb-4" />
    </div>
  );
}

export default LocationLoadingPopup;
