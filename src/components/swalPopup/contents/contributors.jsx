import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { MODAL_SHELL, MODAL_TITLE, MODAL_CONTENT, CloseButton } from "./modalStyles";

function ContributorsPopup({ close }) {
  const contributors = [
    { name: "@derrysigma", url: "https://instagram.com/derrysigma" },
    { name: "@ibnshadiq", url: "https://instagram.com/ibnshadiq" },
    { name: "@rejanuiss", url: "https://instagram.com/rejanuiss" },
    { name: "@installerpreview", url: "https://instagram.com/installerpreview" },
    { name: "@yuhanas.yu", url: "https://instagram.com/yuhanas.yu" }
  ];

  return (
    <div className={MODAL_SHELL}>
      <CloseButton onClose={close} />
      <div className={MODAL_TITLE}>
        <FontAwesomeIcon icon={faUsers} />
        <span className="label mx-2">Contributors</span>
      </div>
      <div className={MODAL_CONTENT}>
        <ul>
          {contributors.map((contributor, index) => (
            <li key={index}>
              <a href={contributor.url} target="_blank" rel="noopener noreferrer" className="underline">
                {contributor.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ContributorsPopup;
