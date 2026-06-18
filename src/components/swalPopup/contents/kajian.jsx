import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faMosque,
  faNoteSticky,
  faUser,
  faMapLocationDot,
  faPhone,
  faEnvelopeCircleCheck,
  faTimes,
  faCalendar,
  faCity,
  faTags,
  faChevronDown,
  faThumbsUp,
  faUserCheck,
  faShareNodes,
  faCalendarPlus,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "../../../utils/helpers";
import { formatTimeRange, getKajianStatus, getStartMoment, getEndMoment } from "../../../utils/kajianStatus";
import { REACT } from "../../../services/api";
import { hasReacted, setReacted, getCounts, setCounts } from "../../../utils/reactions";
import { CloseButton } from "./modalStyles";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Suka (like) + Akan Hadir (going) reactions for one kajian. Optimistic with a
// localStorage-backed toggle, reconciled with the server's returned counts.
function ReactionBar({ info }) {
  const id = info.id;
  // Prefer counts cached from a prior reaction this session over the page-load
  // snapshot, so closing and reopening the popup keeps the updated count.
  const cached = id ? getCounts(id) : null;
  const [likes, setLikes] = useState(cached ? cached.likes : Number(info.likes) || 0);
  const [going, setGoing] = useState(cached ? cached.going : Number(info.going) || 0);
  const [liked, setLiked] = useState(id ? hasReacted(id, "like") : false);
  const [attending, setAttending] = useState(id ? hasReacted(id, "going") : false);
  const [busy, setBusy] = useState(false);

  if (!id) return null;

  const toggle = async (type) => {
    if (busy) return;
    const isOn = type === "like" ? liked : attending;
    const op = isOn ? "remove" : "add";
    const delta = isOn ? -1 : 1;
    const setOn = type === "like" ? setLiked : setAttending;

    // Optimistic update.
    const optLikes = type === "like" ? Math.max(0, likes + delta) : likes;
    const optGoing = type === "going" ? Math.max(0, going + delta) : going;
    setOn(!isOn);
    setLikes(optLikes);
    setGoing(optGoing);
    setReacted(id, type, !isOn);
    setCounts(id, optLikes, optGoing);
    setBusy(true);

    try {
      const res = await REACT(id, type, op);
      const srvLikes = typeof res?.likes === "number" ? res.likes : optLikes;
      const srvGoing = typeof res?.going === "number" ? res.going : optGoing;
      setLikes(srvLikes);
      setGoing(srvGoing);
      setCounts(id, srvLikes, srvGoing);
    } catch {
      // Revert on failure.
      setOn(isOn);
      setLikes(likes);
      setGoing(going);
      setReacted(id, type, isOn);
      setCounts(id, likes, going);
    } finally {
      setBusy(false);
    }
  };

  const pill = (active) =>
    `flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-[13px] font-semibold transition-transform active:scale-95 disabled:opacity-70 ${
      active ? "bg-[#7a5530] text-[#f1dcb7]" : "bg-white/70 text-gray-700 border border-[#d8c4a0]"
    }`;

  return (
    <div className="flex gap-2 pt-1">
      <button className={pill(liked)} onClick={() => toggle("like")} disabled={busy} aria-pressed={liked}>
        <FontAwesomeIcon icon={faThumbsUp} /> Suka <span className="tabular-nums">{likes}</span>
      </button>
      <button className={pill(attending)} onClick={() => toggle("going")} disabled={busy} aria-pressed={attending}>
        <FontAwesomeIcon icon={faUserCheck} /> Akan Hadir <span className="tabular-nums">{going}</span>
      </button>
    </div>
  );
}

// Treat null/empty/"undefined" (string) as missing.
const isBlank = (v) => v == null || String(v).trim() === "" || String(v).trim().toLowerCase() === "undefined";

// True when SourceInfo would render something — so callers can skip the empty row+icon.
const hasSourceInfo = (info) =>
  !!(
    info.src_text ||
    info.src_image ||
    cleanText(info.src_sender_name) ||
    (!isBlank(info.src_sender_contact)) ||
    (!isBlank(info.src_platform))
  );

// Clean slash-joined source values: drop "undefined" tokens and de-duplicate
// repeats that leaked from the scraper (e.g. "Joko/Joko/undefined" -> "Joko").
const cleanText = (v) => {
  if (isBlank(v)) return "";
  const seen = new Set();
  return String(v)
    .split("/")
    .map((part) => part.trim())
    .filter((part) => {
      if (!part || part.toLowerCase() === "undefined") return false;
      const key = part.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("/")
    .trim();
};

// Renders the "Teks · Gambar dari NAME (CONTACT) via PLATFORM" attribution line,
// omitting any piece that is missing and separating the source links.
function SourceInfo({ info }) {
  const name = cleanText(info.src_sender_name);
  const contact = isBlank(info.src_sender_contact) ? "" : String(info.src_sender_contact).trim();
  const platform = isBlank(info.src_platform) ? "" : String(info.src_platform).trim();

  const links = [];
  if (info.src_text) {
    links.push(
      <a key="teks" href={`${BASE_URL}/${info.src_text}`} target="_blank" rel="noopener noreferrer" className="underline">
        Teks
      </a>
    );
  }
  if (info.src_image) {
    links.push(
      <a key="gambar" href={`${BASE_URL}/${info.src_image}`} target="_blank" rel="noopener noreferrer" className="underline">
        Gambar
      </a>
    );
  }

  const who = [name, contact ? `(${contact})` : ""].filter(Boolean).join(" ");
  const credit = [who ? `dari ${who}` : "", platform ? `via ${platform}` : ""].filter(Boolean).join(" ");

  if (links.length === 0 && !credit) return null;

  return (
    <span className="text-sm text-left text-gray-800">
      {links.map((link, i) => (
        <React.Fragment key={link.key}>
          {i > 0 && <span className="mx-1">·</span>}
          {link}
        </React.Fragment>
      ))}
      {credit && <span className="mx-1">{credit}</span>}
    </span>
  );
}

// Colored status pill mirroring the map pin colors.
const STATUS_META = {
  ongoing: { label: "Berlangsung", cls: "bg-green-600" },
  upcoming: { label: "Akan datang", cls: "bg-blue-600" },
  passed: { label: "Selesai", cls: "bg-gray-400" },
};

function StatusBadge({ info }) {
  const status = getKajianStatus(info);
  const meta = status && STATUS_META[status];
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white ${meta.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
      {meta.label}
    </span>
  );
}

// Comma/whitespace-separated tags rendered as readable chips.
function TagChips({ tags }) {
  const list = String(tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (list.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((t) => (
        <span key={t} className="rounded-full bg-[#7a5530]/15 px-2.5 py-0.5 text-[12px] font-medium text-[#7a5530]">
          {t.replace(/_/g, " ")}
        </span>
      ))}
    </div>
  );
}

// Build a shareable deep link the app already knows how to open (?k=&d=&lat=&lng=).
const buildShareUrl = (info) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const p = new URLSearchParams();
  if (info.id != null) p.set("k", String(info.id));
  if (info.date) p.set("d", String(info.date));
  if (typeof info.lat === "number") p.set("lat", String(info.lat));
  if (typeof info.lng === "number") p.set("lng", String(info.lng));
  return `${origin}/?${p.toString()}`;
};

// Google Calendar "add event" link with resolved WIB start/end in UTC.
const buildCalendarUrl = (info) => {
  const start = getStartMoment(info);
  const end = getEndMoment(info);
  const p = new URLSearchParams({ action: "TEMPLATE", text: info.topic || "Kajian" });
  const details = [info.speaker && `Pemateri: ${info.speaker}`, info.notes].filter(Boolean).join("\n");
  if (details) p.set("details", details);
  const location = [info.loc_name, info.addr].filter(Boolean).join(", ");
  if (location) p.set("location", location);
  if (start && end) {
    const fmt = (m) => m.clone().utc().format("YYYYMMDDTHHmmss") + "Z";
    p.set("dates", `${fmt(start)}/${fmt(end)}`);
  }
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
};

// Actions row: primary "Open in Maps" + Share + Add-to-calendar.
function KajianActions({ info, openGoogleMaps }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = buildShareUrl(info);
    const text = `${info.topic || "Kajian"}${info.speaker ? ` — ${info.speaker}` : ""}\n${info.loc_name || ""}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: info.topic || "Kajian", text, url });
        return;
      }
    } catch {
      return; // user cancelled the share sheet
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — silently ignore
    }
  };

  const iconBtn =
    "w-11 shrink-0 flex items-center justify-center rounded-full bg-white/70 text-[#7a5530] border border-[#d8c4a0] active:scale-95 transition-transform";

  return (
    <div className="flex gap-2 pt-1">
      <button
        className="flex-1 flex items-center justify-center gap-2 whitespace-nowrap py-2.5 px-4 rounded-full bg-[#7a5530] text-[#f1dcb7] text-sm font-semibold shadow-[0_4px_10px_-4px_#000] active:scale-95 transition-transform"
        onClick={() => openGoogleMaps(info)}
      >
        <FontAwesomeIcon icon={faMapLocationDot} /> Buka di Maps
      </button>
      <button className={iconBtn} onClick={handleShare} title="Bagikan" aria-label="Bagikan kajian">
        <FontAwesomeIcon icon={copied ? faCheck : faShareNodes} className={copied ? "text-green-600" : ""} />
      </button>
      <a
        className={iconBtn}
        href={buildCalendarUrl(info)}
        target="_blank"
        rel="noopener noreferrer"
        title="Tambah ke Google Kalender"
        aria-label="Tambah ke Google Kalender"
      >
        <FontAwesomeIcon icon={faCalendarPlus} />
      </a>
    </div>
  );
}

function KajianPopup({ info, group, close }) {
  // Hooks must be at top level - used for single item scroll indicator
  const scrollRef = useRef(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  // Full-size poster lightbox; holds the image URL when open, null when closed.
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
        // Show hint if there's more content to scroll
        setShowScrollHint(scrollHeight > clientHeight && scrollTop < scrollHeight - clientHeight - 10);
      }
    };
    
    // Check initially after a small delay to ensure content is rendered
    const timer = setTimeout(checkScroll, 100);
    
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScroll);
    }
    
    return () => {
      clearTimeout(timer);
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', checkScroll);
      }
    };
  }, [info, group.length]);

  const handleScrollDown = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ top: 150, behavior: 'smooth' });
    }
  };

  const openGoogleMaps = (info) => {
    if (info.gmaps_url) {
      window.open(info.gmaps_url, "_blank");
    } else if (info.lat && info.lng) {
      window.open(`https://www.google.com/maps?q=${info.lat},${info.lng}`, "_blank");
    } else {
      const placeName = info.loc_name;
      const address = info.addr;
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName + " " + address)}`,
        "_blank"
      );
    }
  };

  // Fullscreen poster viewer. Portaled to <body> so it sits above the SweetAlert popup.
  const lightboxEl =
    lightboxSrc &&
    createPortal(
      <div
        className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
        onClick={() => setLightboxSrc(null)}
      >
        <button
          className="absolute top-4 right-4 px-2 p-[6px] bg-white/20 text-white rounded-full flex items-center justify-center"
          onClick={() => setLightboxSrc(null)}
          aria-label="Tutup"
        >
          <FontAwesomeIcon icon={faTimes} size="lg" />
        </button>
        <img
          src={lightboxSrc}
          alt="poster"
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>,
      document.body
    );

  if (group.length > 1) {
    return (
      <div className="relative flex flex-col text-base py-2 bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]">
        {lightboxEl}
        {/* Header with count indicator */}
        <div className="flex justify-between items-center px-3 pb-2">
          <span className="text-sm font-semibold text-gray-700">{group.length} Kajian di lokasi ini</span>
          <button
            className="px-2 p-[6px] bg-custom-yellow-4 text-gray-600 hover:text-gray-800 rounded-full flex items-center justify-center shadow-[0_0_8px_-4px_#000]"
            onClick={close}
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        {/* Scrollable content area */}
        <div 
          ref={scrollRef}
          className="max-h-[60vh] overflow-y-auto scroll-smooth px-2"
        >
          {group.map((info, i) => (
            <div key={i} className="group-item mb-3">
              <div className="relative bg-custom-yellow-3 rounded-xl overflow-hidden shadow-[0_0_4px_-2px_#000]">
                <div className="content flex flex-col">
                  {info.src_image && (
                    <img
                      src={`${import.meta.env.VITE_BASE_URL}/${info.src_image}`}
                      alt="poster"
                      className="w-full object-contain max-h-[25vh] cursor-zoom-in"
                      onClick={() => setLightboxSrc(`${import.meta.env.VITE_BASE_URL}/${info.src_image}`)}
                    />
                  )}
                  <div className="description space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="title text-sm font-semibold flex-1">{info.topic}</div>
                      <StatusBadge info={info} />
                    </div>
                    <div className="flex gap-3 items-center">
                      <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                      <span className="text-[13px] text-left text-gray-800">{info.speaker}</span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <FontAwesomeIcon icon={faMosque} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                      <span className="text-[13px] text-left text-gray-800">{info.loc_name}</span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <FontAwesomeIcon icon={faCity} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                      <span className="text-sm text-left text-gray-800">{info.city}</span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                      <span className="text-[13px] text-left text-gray-800">{formatDate(info.date)}</span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                      <span className="text-[13px] text-left text-gray-800">
                        {formatTimeRange(info, { endFallback: "Selesai" })}
                      </span>
                    </div>
                    {info.contact !== "" && info.contact !== "-" && (
                      <div className="flex gap-3 items-center">
                        <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                        <span className="text-[13px] text-left text-gray-800">{info.contact}</span>
                      </div>
                    )}
                    {!isBlank(info.addr) && (
                      <div className="flex gap-3 items-center">
                        <FontAwesomeIcon icon={faMapLocationDot} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                        <span className="text-[13px] text-left text-gray-800 leading-5">{info.addr}</span>
                      </div>
                    )}
                    {info.notes !== "" && (
                      <div className="flex gap-3 items-center">
                        <FontAwesomeIcon icon={faNoteSticky} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                        <span className="text-[13px] text-left text-gray-800">{info.notes}</span>
                      </div>
                    )}
                    {hasSourceInfo(info) && (
                      <div className="flex gap-3 items-center">
                        <FontAwesomeIcon icon={faEnvelopeCircleCheck} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                        <SourceInfo info={info} />
                      </div>
                    )}
                    {!isBlank(info.tags) && (
                      <div className="flex gap-3 items-start">
                        <FontAwesomeIcon icon={faTags} className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                        <TagChips tags={info.tags} />
                      </div>
                    )}

                    <ReactionBar info={info} />

                    <KajianActions info={info} openGoogleMaps={openGoogleMaps} />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Scroll indicator — compact sticky chevron so it barely covers content. */}
          {showScrollHint && (
            <div className="sticky bottom-1 -mt-9 z-10 flex justify-center pointer-events-none">
              <button
                onClick={handleScrollDown}
                className="w-8 h-8 flex items-center justify-center text-gray-700 bg-custom-yellow-2/95 rounded-full shadow-md animate-bounce pointer-events-auto"
                aria-label="Geser ke bawah untuk lihat lebih"
              >
                <FontAwesomeIcon icon={faChevronDown} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    return (
      <div className="relative flex flex-col text-base py-2 bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]">
        {lightboxEl}
        <CloseButton onClose={close} />
        <div
          ref={scrollRef}
          className="content max-h-[60vh] overflow-y-auto mx-2 bg-custom-yellow-3 rounded-xl scroll-smooth"
        >
          {info.src_image && (
            <img
              src={`${import.meta.env.VITE_BASE_URL}/${info.src_image}`}
              alt="poster"
              className="rounded-t-xl w-full object-contain max-h-[35vh] cursor-zoom-in"
              onClick={() => setLightboxSrc(`${import.meta.env.VITE_BASE_URL}/${info.src_image}`)}
            />
          )}

          <div className="description space-y-2 p-3">
            {/* pr-10 keeps a long title / the status badge clear of the close (✕) button. */}
            <div className="flex flex-col items-start gap-1.5 px-1 pt-1 pb-1 pr-10">
              <div className="title font-semibold text-sm md:text-base">{info.topic}</div>
              <StatusBadge info={info} />
            </div>
            <div className="flex gap-3 items-center">
              <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-700 flex-shrink-0" />
              <span className="text-sm text-left text-gray-800">{info.speaker}</span>
            </div>
            <div className="flex gap-3 items-center">
              <FontAwesomeIcon icon={faMosque} className="w-4 h-4 text-gray-700 flex-shrink-0" />
              <span className="text-sm text-left text-gray-800">{info.loc_name}</span>
            </div>
            {info.city && (
              <div className="flex gap-3 items-center">
                <FontAwesomeIcon icon={faCity} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                <span className="text-sm text-left text-gray-800">{info.city}</span>
              </div>
            )}
            <div className="flex gap-3 items-center">
              <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-gray-700 flex-shrink-0" />
              <span className="text-[13px] text-left text-gray-800">{formatDate(info.date)}</span>
            </div>
            <div className="flex gap-3 items-center">
              <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-gray-700 flex-shrink-0" />
              <span className="text-sm text-left text-gray-800">
                {formatTimeRange(info, { endFallback: "Selesai" })}
              </span>
            </div>
            {info.contact !== "" && info.contact !== "-" && (
              <div className="flex gap-3 items-center">
                <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                <span className="text-sm text-left text-gray-800">{info.contact}</span>
              </div>
            )}
            {!isBlank(info.addr) && (
              <div className="flex gap-3 items-center">
                <FontAwesomeIcon icon={faMapLocationDot} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                <span className="text-sm text-left text-gray-800">{info.addr}</span>
              </div>
            )}
            {info.notes !== "" && (
              <div className="flex gap-3 items-center">
                <FontAwesomeIcon icon={faNoteSticky} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                <span className="text-sm text-left text-gray-800">{info.notes}</span>
              </div>
            )}
            {hasSourceInfo(info) && (
              <div className="flex gap-3 items-center">
                <FontAwesomeIcon icon={faEnvelopeCircleCheck} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                <SourceInfo info={info} />
              </div>
            )}
            {!isBlank(info.tags) && (
              <div className="flex gap-3 items-start">
                <FontAwesomeIcon icon={faTags} className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                <TagChips tags={info.tags} />
              </div>
            )}

            <ReactionBar info={info} />

            {/* Scroll indicator — compact sticky chevron. */}
            {showScrollHint && (
              <div className="sticky bottom-1 -mt-7 z-10 flex justify-center pointer-events-none">
                <button
                  onClick={handleScrollDown}
                  className="w-8 h-8 flex items-center justify-center text-gray-700 bg-custom-yellow-2/95 rounded-full shadow-md animate-bounce pointer-events-auto"
                  aria-label="Geser ke bawah untuk lihat lebih"
                >
                  <FontAwesomeIcon icon={faChevronDown} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-3 pt-3 pb-1">
          <KajianActions info={info} openGoogleMaps={openGoogleMaps} />
        </div>
      </div>
    );
  }
}

export default KajianPopup;
