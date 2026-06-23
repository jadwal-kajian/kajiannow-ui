import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faMosque,
  faUser,
  faMapLocationDot,
  faTimes,
  faCalendar,
  faChevronDown,
  faThumbsUp,
  faUserCheck,
  faShareNodes,
  faCalendarPlus,
  faCheck,
  faLocationDot,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "../../../utils/helpers";
import { formatTimeRange, getKajianStatus, getStartMoment, getEndMoment } from "../../../utils/kajianStatus";
import { REACT } from "../../../services/api";
import { hasReacted, setReacted, getCounts, setCounts } from "../../../utils/reactions";
import { ShowPopupInfo } from "../../kajianMap/ShowPopupInfo";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Square poster thumbnail. Nothing renders when there's no poster — the card's
// text just fills the width (cleaner than an empty placeholder).
function Thumb({ info, className = "", onClick }) {
  if (!info.src_image) return null;
  return (
    <img
      src={`${BASE_URL}/${info.src_image}`}
      alt=""
      onClick={onClick}
      className={`object-cover ${onClick ? "cursor-zoom-in" : ""} ${className}`}
    />
  );
}

Thumb.propTypes = { info: PropTypes.object.isRequired, className: PropTypes.string, onClick: PropTypes.func };

// Prayer-relative times (Ba'da Maghrib, etc.) get a "follows prayer schedule" note.
const isPrayerRelative = (info) =>
  /ba'?da|subuh|dzuhur|zuhur|ashar|maghrib|isya|jum'?at/i.test(`${info.time_start || ""} ${info.time || ""}`);

// Like count, preferring the session-cached value (a reaction made this session)
// over the page-load snapshot — keeps the location sheet in sync with the flyer.
const likeCountOf = (info) => {
  const c = info.id ? getCounts(info.id) : null;
  return c ? c.likes : Number(info.likes) || 0;
};

// Compact count (e.g. 1.284 → "1,3 rb"); small numbers render unchanged.
const fmtCount = (n) =>
  new Intl.NumberFormat("id", { notation: "compact", maximumFractionDigits: 1 }).format(Number(n) || 0);

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

  // Shared pill; `tone` colors the active state — "ok" (green) for Suka, accent (teal) for Akan Hadir.
  const pill = (active, tone) =>
    `flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold transition-transform active:scale-95 disabled:opacity-70 ${
      active
        ? tone === "ok"
          ? "bg-ok-bg text-ok border border-ok"
          : "bg-accent text-accent-ink border border-accent"
        : "bg-surface-2 text-ink border border-line"
    }`;

  return (
    <div className="flex gap-2 pt-1">
      <button className={pill(liked, "ok")} onClick={() => toggle("like")} disabled={busy} aria-pressed={liked}>
        <FontAwesomeIcon icon={faThumbsUp} /> Suka <span className="tabular-nums">{fmtCount(likes)}</span>
      </button>
      <button className={pill(attending, "accent")} onClick={() => toggle("going")} disabled={busy} aria-pressed={attending}>
        <FontAwesomeIcon icon={faUserCheck} /> Akan Hadir <span className="tabular-nums">{fmtCount(going)}</span>
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
    <span className="text-sm text-left text-ink">
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

// Soft-tinted status pill (label + colored dot), keyed to the design's status palette.
const STATUS_META = {
  ongoing: { label: "Berlangsung", cls: "bg-ok-bg text-ok", dot: "bg-ok" },
  upcoming: { label: "Akan datang", cls: "bg-soon-bg text-soon", dot: "bg-soon" },
  passed: { label: "Selesai", cls: "bg-done-bg text-done", dot: "bg-done" },
};

function StatusBadge({ info }) {
  const status = getKajianStatus(info);
  const meta = status && STATUS_META[status];
  if (!meta) return null;
  return (
    <span className={`self-start inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
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
        <span key={t} className="rounded-full bg-surface-2 border border-line px-2.5 py-0.5 text-[12px] font-medium text-ink">
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

  const secBtn =
    "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-surface border border-line text-ink text-sm font-bold active:scale-95 transition-transform";

  // Maps full-width on top, then Kalender + Bagikan side by side (per the design).
  return (
    <div className="flex flex-col gap-2.5">
      <button
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-accent text-accent-ink text-[15px] font-bold shadow-[0_10px_24px_-12px_rgba(13,107,110,.6)] active:scale-95 transition-transform"
        onClick={() => openGoogleMaps(info)}
      >
        <FontAwesomeIcon icon={faMapLocationDot} /> Buka di Google Maps
      </button>
      <div className="flex gap-2.5">
        <a
          className={secBtn}
          href={buildCalendarUrl(info)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Tambah ke Google Kalender"
        >
          <FontAwesomeIcon icon={faCalendarPlus} className="text-accent" /> Kalender
        </a>
        <button className={secBtn} onClick={handleShare} aria-label="Bagikan kajian">
          <FontAwesomeIcon icon={copied ? faCheck : faShareNodes} className={copied ? "text-ok" : "text-accent"} />
          {copied ? "Tersalin" : "Bagikan"}
        </button>
      </div>
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
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center"
          onClick={() => setLightboxSrc(null)}
          aria-label="Tutup"
        >
          <FontAwesomeIcon icon={faTimes} size="lg" />
        </button>
        <img
          src={lightboxSrc}
          alt="Poster kajian"
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>,
      document.body
    );

  if (group.length > 1) {
    // Order the list so finished (passed) kajian sink to the bottom: ongoing
    // first, then upcoming, then passed/unknown. Stable, so events that share a
    // status keep their original (time-based) order. Sort a copy, not the prop.
    const STATUS_RANK = { ongoing: 3, upcoming: 2, passed: 1 };
    const orderedGroup = [...group].sort(
      (a, b) => (STATUS_RANK[getKajianStatus(b)] || 0) - (STATUS_RANK[getKajianStatus(a)] || 0)
    );
    const loc = group[0];
    return (
      <div className="relative flex flex-col bg-surface text-ink text-left">
        {lightboxEl}
        {/* Grab handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-line" />
        </div>
        {/* Header: count + location */}
        <div className="flex items-start justify-between gap-2 px-4 pb-3 border-b border-line">
          <div className="min-w-0">
            <div className="text-lg font-extrabold">{group.length} Kajian di lokasi ini</div>
            <div className="flex items-center gap-1.5 mt-1 text-[13px] font-semibold text-ink-dim">
              <FontAwesomeIcon icon={faLocationDot} className="text-accent" />
              <span className="truncate">{[loc.loc_name, loc.city].filter(Boolean).join(" · ")}</span>
            </div>
          </div>
          <button
            className="w-10 h-10 flex-none bg-surface-2 text-ink-dim hover:text-ink border border-line rounded-xl flex items-center justify-center"
            onClick={close}
            aria-label="Tutup"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Compact session cards — tap to open the full flyer. */}
        <div ref={scrollRef} className="max-h-[64vh] overflow-y-auto scroll-smooth px-3 py-3 flex flex-col gap-3">
          {orderedGroup.map((info, i) => (
            <button
              key={i}
              onClick={() => ShowPopupInfo({ location: info, group: [info] })}
              className="flex gap-3 w-full text-left bg-surface-2 border border-line rounded-2xl p-2.5 active:scale-[.99] transition-transform"
            >
              <Thumb info={info} className="w-[78px] h-[78px] flex-none rounded-xl" />
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <StatusBadge info={info} />
                <div className="kn-clamp2 text-[15px] font-bold leading-tight">{info.topic}</div>
                <div className="truncate text-[12px] font-semibold text-ink-dim">{info.speaker}</div>
                <div className="flex items-center gap-3 text-[12px] text-ink-dim mt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faClock} className="text-[11px]" />
                    {formatTimeRange(info, { endFallback: "selesai" })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faThumbsUp} className="text-[11px]" />
                    {fmtCount(likeCountOf(info))}
                  </span>
                </div>
              </div>
            </button>
          ))}

          {showScrollHint && (
            <div className="sticky bottom-1 -mt-9 z-10 flex justify-center pointer-events-none">
              <button
                onClick={handleScrollDown}
                className="w-8 h-8 flex items-center justify-center text-ink bg-surface-2 border border-line rounded-full shadow-md animate-bounce pointer-events-auto"
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
    const cat = String(info.tags || "").split(",")[0]?.trim();
    const posterUrl = info.src_image ? `${BASE_URL}/${info.src_image}` : null;
    return (
      <div className="relative flex flex-col bg-surface text-ink text-left">
        {lightboxEl}
        {/* Sticky header: close · title · A/B toggle */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-line">
          <span className="flex-1 font-bold">Detail Kajian</span>
          <button
            type="button"
            onClick={close}
            aria-label="Tutup"
            className="w-10 h-10 flex-none rounded-xl bg-surface-2 border border-line text-ink-dim hover:text-ink flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Scrollable body */}
        <div ref={scrollRef} className="overflow-y-auto px-4 py-4 scroll-smooth" style={{ maxHeight: "calc(92vh - 168px)" }}>
          {/* Poster-forward hero. Title sits BELOW the poster (real flyers carry
              their own title, so overlaying ours doubles up / collides). */}
          {posterUrl ? (
            <div className="relative rounded-2xl overflow-hidden mb-3 aspect-[4/5]">
              <img
                src={posterUrl}
                alt={`Poster: ${info.topic || "kajian"}`}
                className="absolute inset-0 w-full h-full object-cover cursor-zoom-in"
                onClick={() => setLightboxSrc(posterUrl)}
              />
              <div className="absolute top-3 left-3">
                <StatusBadge info={info} />
              </div>
              {cat && (
                <div className="absolute top-3 right-3" aria-hidden="true">
                  <span className="rounded-lg bg-surface/80 px-2 py-1 text-[10px] font-mono text-ink-dim">poster · {cat}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-surface-2 border border-line p-5 mb-3">
              <StatusBadge info={info} />
              {cat && <div className="mt-2 text-[10px] font-mono text-ink-dim">tanpa poster · {cat}</div>}
            </div>
          )}
          <div className="text-[22px] font-extrabold leading-tight mb-4">{info.topic}</div>

          {/* Pemateri */}
          <div className="flex items-center gap-3 mb-4">
            <span className="w-11 h-11 flex-none rounded-full bg-amber-soft text-amber flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wide text-ink-dim">Pemateri</div>
              <div className="text-base font-bold truncate">{info.speaker}</div>
            </div>
          </div>

          {/* Grouped info card */}
          <div className="rounded-2xl bg-surface-2 border border-line overflow-hidden mb-4">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line">
              <FontAwesomeIcon icon={faMosque} className="w-5 text-accent flex-none" />
              <div className="min-w-0">
                <div className="font-bold leading-tight">{info.loc_name}</div>
                {!isBlank(info.addr) && <div className="text-[13px] text-ink-dim leading-tight mt-0.5">{info.addr}{info.city ? `, ${info.city}` : ""}</div>}
              </div>
            </div>
            {formatDate(info.date) && (
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line">
                <FontAwesomeIcon icon={faCalendar} className="w-5 text-accent flex-none" />
                <div className="font-bold">{formatDate(info.date)}</div>
              </div>
            )}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <FontAwesomeIcon icon={faClock} className="w-5 text-accent flex-none" />
              <div className="min-w-0">
                <div className="font-bold">{formatTimeRange(info, { endFallback: "selesai" })}</div>
                {isPrayerRelative(info) && (
                  <div className="text-[12px] font-bold text-amber mt-0.5">Waktu mengikuti jadwal shalat</div>
                )}
              </div>
            </div>
          </div>

          {/* Catatan */}
          {!isBlank(info.notes) && (
            <>
              <div className="text-[13px] font-extrabold mb-1.5">Catatan</div>
              <div className="text-[14px] leading-relaxed text-ink-dim mb-4">{info.notes}</div>
            </>
          )}

          {/* Tags */}
          {!isBlank(info.tags) && (
            <div className="mb-4">
              <TagChips tags={info.tags} />
            </div>
          )}

          {/* Contact + source */}
          {(!isBlank(info.contact) && String(info.contact).trim() !== "-") || hasSourceInfo(info) ? (
            <div className="flex items-start gap-2 text-[12px] text-ink-dim mb-4">
              <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5 flex-none" />
              <div className="min-w-0 space-y-0.5">
                {hasSourceInfo(info) && <div>Sumber: <SourceInfo info={info} /></div>}
                {!isBlank(info.contact) && String(info.contact).trim() !== "-" && <div>Kontak {info.contact}</div>}
              </div>
            </div>
          ) : null}

          {/* Reactions */}
          <ReactionBar info={info} />
        </div>

        {/* Sticky footer actions */}
        <div className="border-t border-line bg-surface px-4 pt-3 pb-4 shadow-[0_-14px_24px_-18px_rgba(60,40,10,.5)]">
          <KajianActions info={info} openGoogleMaps={openGoogleMaps} />
        </div>
      </div>
    );
  }
}

ReactionBar.propTypes = { info: PropTypes.object };
SourceInfo.propTypes = { info: PropTypes.object };
StatusBadge.propTypes = { info: PropTypes.object };
TagChips.propTypes = { tags: PropTypes.string };
KajianActions.propTypes = { info: PropTypes.object, openGoogleMaps: PropTypes.func };
KajianPopup.propTypes = {
  info: PropTypes.object,
  group: PropTypes.array,
  close: PropTypes.func,
};

export default KajianPopup;
