import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";

function ContributorsPopup({ close }) {
  const contributors = [
    { name: "@derrysigma", url: "https://instagram.com/derrysigma" },
    { name: "@ibnshadiq", url: "https://instagram.com/ibnshadiq" },
    { name: "@rejanuiss", url: "https://instagram.com/rejanuiss" },
    { name: "@installerpreview", url: "https://instagram.com/installerpreview" },
    { name: "@yuhanas.yu", url: "https://instagram.com/yuhanas.yu" }
  ];

  return (
    <div className="relative flex flex-col text-center text-base py-2 bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]">
      <div className="title pb-2 font-semibold p-3">
        <FontAwesomeIcon icon={faUsers} />
        <span className="label mx-2">Contributors</span>
      </div>
      <div className="content p-3 max-w-[90%] md:max-w-full mx-auto flex flex-col gap-2 text-[13px] md:text-base">
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
      <div className="action-area flex gap-2 justify-center items-center p-3 text-sm font-semibold">
        <button className="cancel p-2 px-4 rounded-full bg-[#efd8ad] text-sm font-semibold" onClick={close}>
          Close
        </button>
      </div>
    </div>
  );
}

export default ContributorsPopup;
