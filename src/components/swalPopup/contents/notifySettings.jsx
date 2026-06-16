import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faClock,
  faLocationDot,
  faMoon,
  faDesktop,
  faTriangleExclamation,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

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
        checked ? "bg-[#7a5530]" : "bg-black/20"
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
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
    "w-8 h-8 flex items-center justify-center text-lg font-semibold text-[#7a5530] disabled:opacity-30 active:scale-90 transition-transform";
  return (
    <div className="flex items-center rounded-full bg-white/80 border border-[#d8c4a0] overflow-hidden shrink-0">
      <button type="button" className={btn} disabled={disabled || v <= min}
        onClick={() => onChange(Math.max(min, v - step))} aria-label="Kurangi">−</button>
      <span className="px-1 min-w-[64px] text-center text-sm font-semibold tabular-nums text-gray-800">
        {v}<span className="text-[11px] text-gray-500"> {unit}</span>
      </span>
      <button type="button" className={btn} disabled={disabled}
        onClick={() => onChange(v + step)} aria-label="Tambah">+</button>
    </div>
  );
}

// One settings row: icon chip + label/sublabel + trailing control.
function Row({ icon, title, subtitle, children, muted }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl bg-white/45 ${muted ? "opacity-60" : ""}`}>
      <span className="w-9 h-9 shrink-0 rounded-full bg-[#7a5530] text-[#f1dcb7] flex items-center justify-center">
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

const NotifySettingsPopup = ({ settings, onSave, close, userLocation, push = {} }) => {
  const [enabled, setEnabled] = useState(!!settings.enabled);
  const [radiusKm, setRadiusKm] = useState(Number(settings.radiusKm) || 5);
  const [leadMinutes, setLeadMinutes] = useState(Number(settings.leadMinutes) || 60);
  const [permission, setPermission] = useState(currentPermission());
  const [showHelp, setShowHelp] = useState(false);

  // Background push (server-sent, works while the site is closed).
  const { pushSupported, getIsSubscribed, subscribePush, unsubscribePush } = push;
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState("");

  useEffect(() => {
    let alive = true;
    if (pushSupported && getIsSubscribed) {
      getIsSubscribed().then((on) => alive && setPushOn(on));
    }
    return () => {
      alive = false;
    };
  }, [pushSupported, getIsSubscribed]);

  // Turning the in-tab feature on requires OS notification permission; ask for it.
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
        if (pushOn) {
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
          setPushError("Gagal mengaktifkan notifikasi latar belakang. Coba lagi.");
        }
        return;
      }
      setPushBusy(false);
    }

    onSave({ enabled: enabled && permission === "granted", radiusKm: km, leadMinutes: mins });
  };

  const blocked = supported && permission === "denied";

  return (
    <div className="relative flex flex-col bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 pt-5 pb-3 px-4">
        <span className="w-12 h-12 rounded-full bg-[#7a5530] text-[#f1dcb7] flex items-center justify-center shadow-[0_4px_10px_-4px_#000]">
          <FontAwesomeIcon icon={faBell} className="text-lg" />
        </span>
        <h2 className="font-bold text-lg text-gray-800">Notifikasi Kajian Terdekat</h2>
        <p className="text-[13px] text-gray-600 text-center max-w-[85%] leading-snug">
          Dapatkan pemberitahuan saat ada kajian di dekat Anda yang akan segera dimulai.
        </p>
      </div>

      <div className="px-4 pb-2 max-h-[58vh] overflow-y-auto flex flex-col gap-2.5">
        {!supported && (
          <p className="text-center text-[13px] text-red-700">Browser Anda tidak mendukung notifikasi.</p>
        )}
        {blocked && (
          <div className="flex items-start gap-2 text-[12px] text-red-800 bg-red-100/70 border border-red-200 rounded-xl p-3">
            <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 shrink-0" />
            <span>Izin notifikasi diblokir. Aktifkan kembali lewat ikon gembok di address bar browser.</span>
          </div>
        )}

        <Row icon={faDesktop} title="Saat situs terbuka" subtitle="Notifikasi selama halaman dibuka">
          <Toggle checked={enabled} disabled={!supported || blocked} onChange={handleToggle} />
        </Row>

        {pushSupported && (
          <Row icon={faMoon} title="Latar belakang" subtitle="Tetap diberi tahu walau situs ditutup">
            <Toggle checked={pushOn} disabled={pushBusy} onChange={setPushOn} />
          </Row>
        )}

        <Row icon={faLocationDot} title="Jarak maksimal" subtitle="Radius pencarian kajian">
          <Stepper value={radiusKm} onChange={setRadiusKm} min={1} step={1} unit="km" />
        </Row>

        <Row icon={faClock} title="Beri tahu sebelum" subtitle="Selang waktu sebelum mulai">
          <Stepper value={leadMinutes} onChange={setLeadMinutes} min={5} step={5} unit="mnt" />
        </Row>

        {pushError && (
          <div className="flex items-start gap-2 text-[12px] text-red-800 bg-red-100/70 border border-red-200 rounded-xl p-3">
            <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 shrink-0" />
            <span>{pushError}</span>
          </div>
        )}

        {/* Collapsible troubleshooting */}
        <div className="rounded-2xl bg-white/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="w-full flex items-center justify-between gap-2 p-3 text-left text-[12px] font-semibold text-gray-700"
          >
            <span>Notifikasi tidak muncul?</span>
            <FontAwesomeIcon icon={faChevronDown} className={`transition-transform ${showHelp ? "rotate-180" : ""}`} />
          </button>
          {showHelp && (
            <div className="px-3 pb-3 text-[12px] text-gray-700 text-left space-y-1.5">
              <p>Izin di browser sudah benar, tetapi sistem Anda mungkin memblokirnya. Pastikan notifikasi untuk browser diizinkan, lalu matikan mode <span className="font-semibold">Jangan Ganggu / Fokus</span>:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li><span className="font-semibold">Windows:</span> Pengaturan → Sistem → Notifikasi → aktifkan untuk browser; matikan Focus Assist.</li>
                <li><span className="font-semibold">macOS:</span> Pengaturan Sistem → Notifikasi → izinkan browser; matikan Fokus.</li>
                <li><span className="font-semibold">Android:</span> Setelan → Aplikasi → browser → Notifikasi → aktif.</li>
                <li><span className="font-semibold">iPhone:</span> notifikasi latar belakang hanya bekerja jika situs ditambahkan ke Layar Utama.</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-center items-center p-4 pt-3">
        <button
          className="flex-1 max-w-[120px] py-2.5 rounded-full bg-black/10 text-gray-700 text-sm font-semibold active:scale-95 transition-transform"
          onClick={close}
        >
          Tutup
        </button>
        <button
          className="flex-1 max-w-[160px] py-2.5 rounded-full bg-[#7a5530] text-[#f1dcb7] text-sm font-semibold shadow-[0_4px_10px_-4px_#000] active:scale-95 transition-transform disabled:opacity-60"
          onClick={handleSave}
          disabled={pushBusy}
        >
          {pushBusy ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </div>
  );
};

export default NotifySettingsPopup;
