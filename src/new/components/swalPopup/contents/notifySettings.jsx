import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faClock,
  faLocationDot,
  faTriangleExclamation,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import {
  MODAL_SHELL,
  MODAL_CONTENT,
  MODAL_ACTIONS,
  BTN_PRIMARY,
  ModalHeader,
  ModalRow,
  CloseButton,
} from "./modalStyles";

const supported = typeof window !== "undefined" && "Notification" in window;

// Reads the live OS-level permission ("default" | "granted" | "denied").
const currentPermission = () => (supported ? Notification.permission : "denied");

// Pill on/off switch (styled, not a raw checkbox).
function Toggle({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full shrink-0 transition-colors duration-200 disabled:opacity-40 ${
        checked ? "bg-accent" : "bg-surface-2 border border-line"
      }`}
    >
      <span
        // Springs across rather than sliding at a constant rate, so the
        // switch reads as a thing that moved instead of a value that
        // changed. Overshoot comes from the easing curve; the page's
        // reduced-motion rule collapses it to an instant change.
        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// Compact [- value unit +] number stepper.
function Stepper({ value, onChange, min, step, unit, disabled }) {
  const v = Number(value) || 0;
  const btn =
    "w-8 h-8 flex items-center justify-center text-lg font-semibold text-accent disabled:opacity-30 active:scale-90 transition-transform";
  return (
    <div className="flex items-center rounded-full bg-surface border border-line overflow-hidden shrink-0">
      <button type="button" className={btn} disabled={disabled || v <= min}
        onClick={() => onChange(Math.max(min, v - step))} aria-label="Kurangi">−</button>
      <span className="px-1 min-w-[64px] text-center text-sm font-semibold tabular-nums text-ink">
        {v}<span className="text-[11px] text-ink-dim"> {unit}</span>
      </span>
      <button type="button" className={btn} disabled={disabled}
        onClick={() => onChange(v + step)} aria-label="Tambah">+</button>
    </div>
  );
}

const NotifySettingsPopup = ({ settings, onSave, close, userLocation, push = {} }) => {
  const [enabled, setEnabled] = useState(!!settings.enabled);
  const [radiusKm, setRadiusKm] = useState(Number(settings.radiusKm) || 5);
  const [leadMinutes, setLeadMinutes] = useState(Number(settings.leadMinutes) || 60);
  const [permission, setPermission] = useState(currentPermission());
  const [showHelp, setShowHelp] = useState(false);

  // Push is how a notification arrives, not a second feature to opt into: the
  // service worker delivers whether or not the page is open, so it follows the
  // one switch rather than having its own. Offering it separately implied you
  // could be notified only while looking at the site, which is not a thing
  // anyone wants and not how the delivery works.
  const { pushSupported, getIsSubscribed, subscribePush, unsubscribePush } = push;
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState("");

  // An existing subscription is the stronger evidence of what is set up: the
  // stored preference can be missing or stale, and showing the switch off for
  // someone who is subscribed would have turned them off on the next save.
  useEffect(() => {
    let alive = true;
    if (pushSupported && getIsSubscribed) {
      getIsSubscribed().then((on) => { if (alive && on) setEnabled(true); });
    }
    return () => { alive = false; };
  }, [pushSupported, getIsSubscribed]);

  // Turning notifications on requires OS notification permission; ask for it.
  const handleToggle = async (next) => {
    if (next && supported && Notification.permission !== "granted") {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setEnabled(false);
        return;
      }
    }
    setEnabled(next);
  };

  const handleSave = async () => {
    const km = Math.max(0.5, Number(radiusKm) || 0);
    const mins = Math.max(5, Math.round(Number(leadMinutes) || 0));

    if (pushSupported) {
      setPushBusy(true);
      setPushError("");
      try {
        if (enabled && permission === "granted") {
          await subscribePush({ lat: userLocation?.lat, lng: userLocation?.lng, radiusKm: km, leadMinutes: mins });
        } else {
          await unsubscribePush();
        }
      } catch (err) {
        setPushBusy(false);
        if (err.message === "no-location") {
          setPushError('Aktifkan lokasi dulu (tombol "Lokasi Saya") agar kami tahu kajian terdekat Anda.');
        } else if (err.message === "denied") {
          setPushError("Izin notifikasi ditolak.");
        } else {
          setPushError("Gagal mengaktifkan notifikasi. Coba lagi.");
        }
        return;
      }
      setPushBusy(false);
    }

    onSave({ enabled: enabled && permission === "granted", radiusKm: km, leadMinutes: mins });
  };

  const blocked = supported && permission === "denied";

  return (
    <div className={MODAL_SHELL}>
      <CloseButton onClose={close} />
      <ModalHeader
        icon={faBell}
        title="Notifikasi Kajian Terdekat"
        subtitle="Dapatkan pemberitahuan saat ada kajian di dekat Anda yang akan segera dimulai."
      />

      <div className={MODAL_CONTENT}>
        {!supported && (
          <p className="text-center text-[13px] text-red-700">Browser Anda tidak mendukung notifikasi.</p>
        )}
        {blocked && (
          <div className="flex items-start gap-2 text-[12px] text-red-800 bg-red-100/70 border border-red-200 rounded-xl p-3">
            <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 shrink-0" />
            <div className="text-left space-y-1">
              <p className="font-semibold">Izin notifikasi situs ini diblokir di browser.</p>
              <p>Ini izin <span className="font-semibold">browser untuk situs ini</span> — beda dari pengaturan notifikasi di HP (yang sudah aktif).</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li><span className="font-semibold">HP (Chrome):</span> ketuk ikon di kiri alamat web (atau menu ⋮) → Setelan situs → Notifikasi → Izinkan, lalu muat ulang.</li>
                <li><span className="font-semibold">Komputer:</span> klik ikon gembok di address bar → Notifikasi → Izinkan.</li>
              </ul>
            </div>
          </div>
        )}

        <ModalRow
          icon={faBell}
          title="Notifikasi kajian terdekat"
          subtitle={pushSupported ? "Tetap diberi tahu walau situs ditutup" : "Notifikasi selama halaman dibuka"}
        >
          <Toggle checked={enabled} disabled={!supported || blocked || pushBusy} onChange={handleToggle} />
        </ModalRow>

        <ModalRow icon={faLocationDot} title="Jarak maksimal" subtitle="Radius pencarian kajian">
          <Stepper value={radiusKm} onChange={setRadiusKm} min={1} step={1} unit="km" />
        </ModalRow>

        <ModalRow icon={faClock} title="Beri tahu sebelum" subtitle="Selang waktu sebelum mulai">
          <Stepper value={leadMinutes} onChange={setLeadMinutes} min={5} step={5} unit="mnt" />
        </ModalRow>

        {pushError && (
          <div className="flex items-start gap-2 text-[12px] text-red-800 bg-red-100/70 border border-red-200 rounded-xl p-3">
            <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 shrink-0" />
            <span>{pushError}</span>
          </div>
        )}

        {/* Collapsible troubleshooting */}
        <div className="rounded-2xl bg-surface-2 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="w-full flex items-center justify-between gap-2 p-3 text-left text-[12px] font-semibold text-ink"
          >
            <span>Notifikasi tidak muncul?</span>
            <FontAwesomeIcon icon={faChevronDown} className={`transition-transform ${showHelp ? "rotate-180" : ""}`} />
          </button>
          {showHelp && (
            <div className="px-3 pb-3 text-[12px] text-ink text-left space-y-1.5">
              <p>Izin di browser sudah benar, tetapi sistem Anda mungkin memblokirnya. Pastikan notifikasi untuk browser diizinkan, lalu matikan mode <span className="font-semibold">Jangan Ganggu / Fokus</span>:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li><span className="font-semibold">Windows:</span> Pengaturan → Sistem → Notifikasi → aktifkan untuk browser; matikan Focus Assist.</li>
                <li><span className="font-semibold">macOS:</span> Pengaturan Sistem → Notifikasi → izinkan browser; matikan Fokus.</li>
                <li><span className="font-semibold">Android:</span> Setelan → Aplikasi → browser → Notifikasi → aktif.</li>
                <li><span className="font-semibold">iPhone:</span> notifikasi saat situs ditutup hanya bekerja jika situs ditambahkan ke Layar Utama.</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className={MODAL_ACTIONS}>
        <button className={BTN_PRIMARY} onClick={handleSave} disabled={pushBusy}>
          {pushBusy ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </div>
  );
};

export default NotifySettingsPopup;
