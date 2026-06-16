import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { MODAL_SHELL, MODAL_TITLE, MODAL_CONTENT, CloseButton } from "./modalStyles";

function PetunjukPopup({ close }) {
  return (
    <div className={MODAL_SHELL}>
      <CloseButton onClose={close} />
      <div className={MODAL_TITLE}>
        <FontAwesomeIcon icon={faInfoCircle} />
        <span className="label mx-2">Petunjuk</span>
      </div>
      <div className={MODAL_CONTENT}>
        <div className="item-info">
          <FontAwesomeIcon icon={faBook} />
          <span className="desc mx-2">Pinpoint merah menunjukkan lokasi kajian</span>
        </div>
        <div className="item-info">
          <FontAwesomeIcon icon={faBook} />
          <span className="desc mx-2">Klik pinpoint untuk melihat detail info kajian</span>
        </div>
      </div>
    </div>
  );
}

export default PetunjukPopup;
