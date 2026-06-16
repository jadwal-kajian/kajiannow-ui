import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapLocationDot, faClock, faBell, faHeart } from "@fortawesome/free-solid-svg-icons";
import logo_only from "assets/images/logo_only.png";

const FEATURES = [
  { icon: faMapLocationDot, title: "Peta Kajian", desc: "Temukan kajian sunnah terdekat lewat peta interaktif." },
  { icon: faClock, title: "Status Waktu", desc: "Tahu kajian yang sedang berlangsung, akan datang, atau selesai." },
  { icon: faBell, title: "Selalu Terbaru", desc: "Jadwal diperbarui rutin dari kontributor di seluruh Indonesia." },
];

function About() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-6 text-custom-yellow-1">
      <div className="flex flex-col items-center text-center">
        <img src={logo_only} alt="KajianNow" className="w-16 h-16 rounded-2xl shadow-[0_0_16px_-4px_#ffe7be]" />
        <h1 className="mt-4 text-2xl font-bold tracking-wide">Tentang KajianNow</h1>
        <p className="mt-2 text-sm leading-relaxed text-custom-yellow-3/90">
          KajianNow membantu kaum muslimin menemukan info kajian sunnah di Indonesia — kapan dan di mana, langsung dari peta.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex items-start gap-3 rounded-2xl bg-white/5 ring-1 ring-custom-yellow-1/20 p-4"
          >
            <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-custom-yellow-1 text-custom-gray-1">
              <FontAwesomeIcon icon={f.icon} />
            </span>
            <div className="text-left">
              <div className="font-semibold text-sm">{f.title}</div>
              <div className="text-[13px] leading-snug text-custom-yellow-3/90">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-[13px] text-custom-yellow-3/80">
        <FontAwesomeIcon icon={faHeart} className="text-red-300" />
        Dibuat untuk umat, gratis selamanya.
      </p>
    </div>
  );
}

export default About;
