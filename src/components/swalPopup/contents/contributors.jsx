import React from "react";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { MODAL_SHELL, MODAL_CONTENT, ModalHeader, CloseButton } from "./modalStyles";

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
      <ModalHeader icon={faUsers} title="Kontributor" subtitle="Terima kasih atas kontribusinya." />
      <div className={MODAL_CONTENT}>
        <ul className="flex flex-col gap-2 pb-2">
          {contributors.map((contributor, index) => (
            <li key={index}>
              <a
                href={contributor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl bg-white/45 py-2.5 px-4 text-center font-semibold text-[#7a5530] active:scale-95 transition-transform"
              >
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
