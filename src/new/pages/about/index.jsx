import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faMosque } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import ContributorsPopup from "../../components/swalPopup/contents/contributors";

const MySwal = withReactContent(Swal);

const STEPS = [
  { n: 1, title: "Jelajahi peta", desc: "Penanda menunjukkan lokasi kajian terdekat beserta jumlahnya." },
  { n: 2, title: "Pilih kajian", desc: "Lihat status, topik, pemateri, dan waktu dalam satu kartu." },
  { n: 3, title: "Hadir & bagikan", desc: 'Tandai "Akan Hadir", buka rute, atau bagikan ke teman.' },
];

function About() {
  const navigate = useNavigate();
  const showContributors = () =>
    MySwal.fire({ html: <ContributorsPopup close={() => MySwal.close()} />, showConfirmButton: false });

  return (
    <div className="min-h-[100dvh] bg-bg text-ink">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/")}
            aria-label="Kembali"
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-surface border border-line text-ink active:scale-90 transition-transform"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span className="text-lg font-extrabold">Tentang</span>
        </div>

        <div className="px-5 pb-8">
          <div className="w-16 h-16 rounded-3xl bg-accent text-accent-ink flex items-center justify-center mb-4 shadow-[0_12px_26px_-12px_rgba(13,107,110,.5)]">
            <FontAwesomeIcon icon={faMosque} className="text-2xl" />
          </div>
          <h1 className="text-3xl font-extrabold">KajianNow</h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-ink-dim">
            Temukan kajian Islam di sekitarmu, langsung dari peta. Lihat mana yang sedang berlangsung, akan datang, atau
            sudah selesai — lalu hadir dengan mudah.
          </p>

          <div className="mt-6 text-[13px] font-extrabold">Cara kerja</div>
          <div className="mt-3 flex flex-col gap-3.5">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-3 items-start">
                <div className="w-7 h-7 flex-none rounded-xl bg-amber-soft text-amber flex items-center justify-center font-extrabold text-sm">
                  {s.n}
                </div>
                <div>
                  <div className="font-bold">{s.title}</div>
                  <div className="text-[13px] leading-snug text-ink-dim">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-surface border border-line p-4 text-[13px] leading-relaxed text-ink-dim">
            Data kajian dikontribusikan oleh{" "}
            <button onClick={showContributors} className="font-bold text-accent">
              komunitas
            </button>
            . Lihat sesuatu yang belum terdaftar? Gunakan tombol <b className="text-accent">Lapor</b> untuk menambahkannya.
          </div>

          <a
            href="https://github.com/jadwal-kajian/kajiannow-ui"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-3 rounded-2xl bg-surface border border-line p-4 active:scale-[.98] transition-transform"
          >
            <FontAwesomeIcon icon={faGithub} className="text-2xl text-ink" />
            <div className="min-w-0">
              <div className="font-bold text-[14px]">Sumber terbuka di GitHub</div>
              <div className="text-[12px] leading-snug text-ink-dim">
                KajianNow bersifat open source — lihat kode, laporkan masalah, atau berkontribusi.
              </div>
            </div>
          </a>

          <div className="mt-6 text-center text-[12px] text-ink-dim">
            Versi 2.0 · Dibuat untuk komunitas Muslim Indonesia
            <div className="mt-1">
              Hosted on{" "}
              <a href="https://derrylab.com" target="_blank" rel="noopener noreferrer" className="text-accent">
                derrylab.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
