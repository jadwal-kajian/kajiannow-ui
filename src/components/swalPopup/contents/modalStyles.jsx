import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

// Shared styling so every popup looks and behaves the same:
// same shell, same header, same button styles, same close affordance.
// All colors come from the design tokens (see index.css / tailwind.config.js),
// so popups follow the active light/dark theme automatically.
export const MODAL_SHELL = "relative flex flex-col text-base bg-surface text-ink";
export const MODAL_TITLE = "title pb-2 font-semibold p-3 text-ink";
export const MODAL_CONTENT =
  "content px-4 pb-2 max-h-[58vh] overflow-y-auto flex flex-col gap-2.5 text-[13px] md:text-base text-ink";
export const MODAL_ACTIONS = "action-area flex gap-2 justify-center items-center p-4 pt-3";

// Filled accent (teal) pill for the primary action of a modal.
export const BTN_PRIMARY =
  "flex-1 max-w-[200px] py-3 px-6 rounded-2xl bg-accent text-accent-ink text-sm font-bold shadow-[0_10px_24px_-12px_rgba(13,107,110,.6)] active:scale-95 transition-transform disabled:opacity-60";
// Muted pill for secondary actions.
export const BTN_SECONDARY =
  "flex-1 max-w-[140px] py-3 px-6 rounded-2xl bg-surface-2 text-ink border border-line text-sm font-bold active:scale-95 transition-transform";

// Round icon chip used in headers and rows (accent by default).
export const ICON_CHIP =
  "shrink-0 rounded-full bg-accent text-accent-ink flex items-center justify-center";

// Rounded card used to group content inside a modal.
export const MODAL_CARD = "rounded-2xl bg-surface-2 border border-line p-3";

/**
 * Standard modal header: a centered round icon chip, a bold title, and an
 * optional subtitle. `danger` tints the chip red (for error states).
 */
export function ModalHeader({ icon, title, subtitle, spin = false, danger = false }) {
  return (
    <div className="flex flex-col items-center gap-2 pt-5 pb-3 px-4">
      <span
        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_10px_24px_-12px_rgba(13,107,110,.5)] ${
          danger ? "bg-red-600 text-white" : "bg-accent text-accent-ink"
        }`}
      >
        <FontAwesomeIcon icon={icon} className="text-lg" spin={spin} />
      </span>
      <h2 className="font-bold text-lg text-ink text-center px-4">{title}</h2>
      {subtitle && (
        <p className="text-[13px] text-ink-dim text-center max-w-[85%] leading-snug">{subtitle}</p>
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
        <div className="font-semibold text-sm text-ink leading-tight">{title}</div>
        {subtitle && <div className="text-[11px] text-ink-dim leading-tight mt-0.5">{subtitle}</div>}
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
      className={`${pos} w-8 h-8 bg-surface-2 text-ink-dim hover:text-ink border border-line rounded-full flex items-center justify-center z-10`}
      onClick={onClose}
      aria-label="Tutup"
    >
      <FontAwesomeIcon icon={faTimes} size="lg" />
    </button>
  );
}
