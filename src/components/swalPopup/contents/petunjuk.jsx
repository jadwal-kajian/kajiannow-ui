import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInfoCircle,
  faMapPin,
  faHandPointer,
  faLayerGroup,
  faEye,
  faFilter,
  faAnglesLeft,
  faLocationCrosshairs,
  faBell,
  faCommentDots,
} from "@fortawesome/free-solid-svg-icons";
import { MODAL_SHELL, ModalHeader, CloseButton } from "./modalStyles";

// One guide row: brown icon chip + title/desc, matching the notif-settings rows.
function Row({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/45 text-left">
      <span className="w-8 h-8 shrink-0 rounded-full bg-[#7a5530] text-[#f1dcb7] flex items-center justify-center">
        <FontAwesomeIcon icon={icon} className="text-xs" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[13px] text-gray-800 leading-tight">{title}</div>
        <div className="text-[11px] text-gray-600 leading-snug mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

// Small section heading inside the guide.
function Section({ children }) {
  return (
    <div className="text-left text-[11px] font-bold uppercase tracking-wide text-[#7a5530]/80 mt-2 px-1">
      {children}
    </div>
  );
}

// Colored dot for the pin-status legend.
function PinDot({ className }) {
  return <span className={`w-3 h-3 rounded-full shrink-0 ${className}`} />;
}

function PetunjukPopup({ close }) {
  return (
    <div className={MODAL_SHELL}>
      <CloseButton onClose={close} />
      <ModalHeader icon={faInfoCircle} title="Petunjuk Penggunaan" />

      <div className="px-4 pb-4 max-h-[64vh] overflow-y-auto flex flex-col gap-2 text-base">
        <p className="text-[12px] text-gray-700 text-left leading-snug px-1">
          KajianNow menampilkan jadwal kajian di sekitar Anda pada peta. Berikut cara memakainya.
        </p>

        <Section>Peta</Section>
        <Row
          icon={faMapPin}
          title="Pinpoint = lokasi kajian"
          desc="Setiap pin menandai tempat kajian berlangsung."
        />
        <Row
          icon={faHandPointer}
          title="Ketuk pin untuk detail"
          desc="Klik sebuah pin untuk melihat tema, pemateri, lokasi, dan waktu kajian."
        />
        <Row
          icon={faLayerGroup}
          title="Beberapa kajian satu tempat"
          desc="Jika satu lokasi punya lebih dari satu kajian, semuanya ditampilkan bersama saat pin diketuk."
        />

        <Section>Warna pin</Section>
        <div className="flex flex-col gap-1.5 p-2.5 rounded-2xl bg-white/45 text-left text-[12px] text-gray-700">
          <div className="flex items-center gap-2">
            <PinDot className="bg-green-600" />
            <span><span className="font-semibold">Hijau</span> — sedang berlangsung</span>
          </div>
          <div className="flex items-center gap-2">
            <PinDot className="bg-blue-600" />
            <span><span className="font-semibold">Biru</span> — akan dimulai</span>
          </div>
          <div className="flex items-center gap-2">
            <PinDot className="bg-gray-400" />
            <span><span className="font-semibold">Abu-abu</span> — sudah selesai</span>
          </div>
        </div>

        <Section>Tombol</Section>
        <Row
          icon={faAnglesLeft}
          title="Ganti hari"
          desc="Panah kiri/kanan untuk pindah hari. Ketuk tanggal di tengah untuk memilih tanggal langsung."
        />
        <Row
          icon={faEye}
          title="Tampilkan semua info"
          desc="Buka semua detail kajian di peta sekaligus tanpa mengetuk pin satu per satu."
        />
        <Row
          icon={faFilter}
          title="Saring & pilih tanggal"
          desc="Saring kajian per kota atau kategori, dan pilih tanggal yang ingin dilihat."
        />
        <Row
          icon={faLocationCrosshairs}
          title="Lokasi Saya"
          desc="Arahkan peta ke posisi Anda agar mudah menemukan kajian terdekat."
        />
        <Row
          icon={faBell}
          title="Notifikasi kajian terdekat"
          desc="Aktifkan pemberitahuan saat ada kajian di dekat Anda yang akan segera dimulai — bisa berjalan walau situs ditutup. Atur radius dan waktu pengingat."
        />
        <Row
          icon={faCommentDots}
          title="Lapor / pesan ke pengembang"
          desc="Kirim koreksi jadwal, usul lokasi baru, atau saran langsung ke pengembang lewat WhatsApp."
        />
      </div>
    </div>
  );
}

export default PetunjukPopup;
