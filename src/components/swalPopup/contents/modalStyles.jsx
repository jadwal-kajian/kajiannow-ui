import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

// Shared styling so every popup looks and behaves the same:
// same shell, same title/content blocks, same button colors, same close affordance.
export const MODAL_SHELL =
  "relative flex flex-col text-center text-base py-2 bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]";
export const MODAL_TITLE = "title pb-2 font-semibold p-3";
export const MODAL_CONTENT =
  "content p-3 max-w-[90%] md:max-w-full mx-auto flex flex-col gap-2 text-[13px] md:text-base";
export const MODAL_ACTIONS = "action-area flex gap-2 justify-center items-center p-3 text-sm font-semibold";
// Dark-brown filled button for the primary action of a modal.
export const BTN_PRIMARY = "p-2 px-6 rounded-full bg-[#7a5530] text-[#f1dcb7] text-sm font-semibold";
// Light tan button for secondary actions.
export const BTN_SECONDARY = "p-2 px-4 rounded-full bg-custom-yellow-3 text-sm font-semibold";

// Top-right close (✕). `sticky` keeps it visible while the shell itself scrolls (e.g. filter).
export function CloseButton({ onClose, sticky = false }) {
  const pos = sticky ? "sticky top-3 right-3 ml-auto" : "absolute top-3 right-3";
  return (
    <button
      className={`${pos} px-2 p-[6px] bg-custom-yellow-4 text-gray-600 hover:text-gray-800 rounded-full flex items-center justify-center z-10 shadow-[0_0_8px_-4px_#000]`}
      onClick={onClose}
      aria-label="Tutup"
    >
      <FontAwesomeIcon icon={faTimes} size="lg" />
    </button>
  );
}
