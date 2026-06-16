import { useState } from "react";

const supported = typeof window !== "undefined" && "Notification" in window;

// Reads the live OS-level permission ("default" | "granted" | "denied").
const currentPermission = () => (supported ? Notification.permission : "denied");

const NotifySettingsPopup = ({ settings, onSave, close }) => {
  const [enabled, setEnabled] = useState(!!settings.enabled);
  const [radiusKm, setRadiusKm] = useState(settings.radiusKm);
  const [leadMinutes, setLeadMinutes] = useState(settings.leadMinutes);
  const [permission, setPermission] = useState(currentPermission());

  // Turning the feature on requires OS notification permission; ask for it then.
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

  const handleSave = () => {
    const km = Math.max(0.1, Number(radiusKm) || 0);
    const mins = Math.max(1, Math.round(Number(leadMinutes) || 0));
    onSave({ enabled: enabled && permission === "granted", radiusKm: km, leadMinutes: mins });
  };

  const blocked = supported && permission === "denied";

  return (
    <div className="relative flex flex-col text-center text-base py-2 bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]">
      <div className="title pb-2 font-semibold p-3">
        <span className="label mx-2">Notifikasi Kajian Terdekat</span>
      </div>

      <div className="content p-3 max-w-[90%] md:max-w-full mx-auto flex flex-col gap-3 text-[13px] md:text-base text-left">
        <p className="text-center">
          Dapatkan notifikasi browser saat ada kajian di dekat Anda yang akan segera dimulai.
        </p>

        {!supported && (
          <p className="text-center text-red-700">
            Browser Anda tidak mendukung notifikasi.
          </p>
        )}

        {blocked && (
          <p className="text-center text-red-700">
            Izin notifikasi diblokir. Aktifkan kembali lewat pengaturan situs di browser Anda.
          </p>
        )}

        <label className="flex items-center justify-between gap-3 bg-[#fff8e1] border border-gray-300 rounded p-3">
          <span className="font-semibold">Aktifkan notifikasi</span>
          <input
            type="checkbox"
            className="w-5 h-5 accent-[#7a5530]"
            checked={enabled}
            disabled={!supported || blocked}
            onChange={(e) => handleToggle(e.target.checked)}
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span>Jarak maksimal (km)</span>
          <input
            type="number"
            min="0.5"
            step="0.5"
            className="w-24 p-2 border border-gray-300 rounded bg-[#fff8e1] text-right"
            value={radiusKm}
            onChange={(e) => setRadiusKm(e.target.value)}
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span>Beri tahu sebelum (menit)</span>
          <input
            type="number"
            min="5"
            step="5"
            className="w-24 p-2 border border-gray-300 rounded bg-[#fff8e1] text-right"
            value={leadMinutes}
            onChange={(e) => setLeadMinutes(e.target.value)}
          />
        </label>

        <p className="text-center text-[12px] text-gray-700">
          Notifikasi hanya muncul selama situs ini terbuka di browser.
        </p>
      </div>

      <div className="action-area flex gap-2 justify-center items-center p-3 text-sm font-semibold">
        <button className="cancel p-2 px-4 rounded-full bg-[#efd8ad] text-sm font-semibold" onClick={close}>
          Tutup
        </button>
        <button
          className="submit p-2 px-6 rounded-full bg-[#7a5530] text-[#f1dcb7] text-sm font-semibold"
          onClick={handleSave}
        >
          Simpan
        </button>
      </div>
    </div>
  );
};

export default NotifySettingsPopup;
