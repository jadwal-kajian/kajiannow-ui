import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

// Shared styling so every popup looks and behaves the same:
// same shell, same header, same button styles, same close affordance.
export const MODAL_SHELL =
  "relative flex flex-col text-base bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]";
export const MODAL_TITLE = "title pb-2 font-semibold p-3";
export const MODAL_CONTENT =
  "content px-4 pb-2 max-h-[58vh] overflow-y-auto flex flex-col gap-2.5 text-[13px] md:text-base";
export const MODAL_ACTIONS = "action-area flex gap-2 justify-center items-center p-4 pt-3";

// Dark-brown filled pill for the primary action of a modal.
export const BTN_PRIMARY =
  "flex-1 max-w-[180px] py-2.5 px-6 rounded-full bg-[#7a5530] text-[#f1dcb7] text-sm font-semibold shadow-[0_4px_10px_-4px_#000] active:scale-95 transition-transform disabled:opacity-60";
// Muted pill for secondary actions.
export const BTN_SECONDARY =
  "flex-1 max-w-[120px] py-2.5 px-6 rounded-full bg-black/10 text-gray-700 text-sm font-semibold active:scale-95 transition-transform";

// Round icon chip used in headers and rows (brand brown by default).
export const ICON_CHIP =
  "shrink-0 rounded-full bg-[#7a5530] text-[#f1dcb7] flex items-center justify-center";

// Translucent rounded card used to group content inside a modal.
export const MODAL_CARD = "rounded-2xl bg-white/45 p-3";

/**
 * Standard modal header: a centered round icon chip, a bold title, and an
 * optional subtitle. `danger` tints the chip red (for error states).
 */
export function ModalHeader({ icon, title, subtitle, spin = false, danger = false }) {
  return (
    <div className="flex flex-col items-center gap-2 pt-5 pb-3 px-4">
      <span
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[0_4px_10px_-4px_#000] ${
          danger ? "bg-red-600 text-white" : "bg-[#7a5530] text-[#f1dcb7]"
        }`}
      >
        <FontAwesomeIcon icon={icon} className="text-lg" spin={spin} />
      </span>
      <h2 className="font-bold text-lg text-gray-800 text-center px-4">{title}</h2>
      {subtitle && (
        <p className="text-[13px] text-gray-600 text-center max-w-[85%] leading-snug">{subtitle}</p>
      )}
    </div>
  );
}

/** A label/value row with a leading icon chip; trailing `children` for a control. */
export function ModalRow({ icon, title, subtitle, children, muted = false }) {
  return (
    <div className={`flex items-center gap-3 ${MODAL_CARD} ${muted ? "opacity-60" : ""}`}>
      <span className={`w-9 h-9 ${ICON_CHIP}`}>
        <FontAwesomeIcon icon={icon} className="text-sm" />
      </span>
      <div className="flex-1 min-w-0 text-left">
        <div className="font-semibold text-sm text-gray-800 leading-tight">{title}</div>
        {subtitle && <div className="text-[11px] text-gray-600 leading-tight mt-0.5">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

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
