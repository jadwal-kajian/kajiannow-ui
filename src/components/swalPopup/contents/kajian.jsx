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
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "../../../utils/helpers";
import { formatTimeRange } from "../../../utils/kajianStatus";
import { REACT } from "../../../services/api";
import { hasReacted, setReacted, getCounts, setCounts } from "../../../utils/reactions";
import { MODAL_ACTIONS, BTN_PRIMARY, CloseButton } from "./modalStyles";

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

// Drop "undefined" tokens that leaked into the source data (e.g. "undefined/undefined/Name").
const cleanText = (v) =>
  isBlank(v)
    ? ""
    : String(v)
        .split("/")
        .map((part) => part.trim())
        .filter((part) => part && part.toLowerCase() !== "undefined")
        .join("/")
        .trim();

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
                    <div className="title text-sm font-semibold">{info.topic}</div>
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
                    <div className="flex gap-3 items-center">
                      <FontAwesomeIcon icon={faMapLocationDot} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                      <span className="text-[13px] text-left text-gray-800 leading-5">{info.addr}</span>
                    </div>
                    {info.notes !== "" && (
                      <div className="flex gap-3 items-center">
                        <FontAwesomeIcon icon={faNoteSticky} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                        <span className="text-[13px] text-left text-gray-800">{info.notes}</span>
                      </div>
                    )}
                    <div className="flex gap-3 items-center">
                      <FontAwesomeIcon icon={faEnvelopeCircleCheck} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                      <SourceInfo info={info} />
                    </div>
                    <div className="flex gap-3 items-center">
                      <FontAwesomeIcon icon={faTags} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                      <span className="text-sm text-left text-gray-800">{info.tags}</span>
                    </div>

                    <ReactionBar info={info} />

                    {/* Google Maps button inside each card */}
                    <button
                      className="w-full text-[12px] font-semibold p-2 mt-2 rounded-lg bg-[#7a5530] text-[#f1dcb7]"
                      onClick={() => openGoogleMaps(info)}
                    >
                      Buka di Google Maps
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        {showScrollHint && (
          <div className="absolute inset-x-0 bottom-16 z-10 flex justify-center pointer-events-none">
            <button 
              onClick={handleScrollDown}
              className="flex flex-col items-center animate-bounce pointer-events-auto"
              aria-label="Scroll untuk lihat lebih"
            >
              <span className="text-xs text-gray-600 bg-custom-yellow-2/90 px-2 py-1 rounded-full shadow-sm">Geser ke bawah</span>
              <FontAwesomeIcon icon={faChevronDown} className="text-gray-600" />
            </button>
          </div>
        )}

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
            <div className="title font-semibold p-3 pl-4 pb-2 text-sm md:text-base">{info.topic}</div>
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
            <div className="flex gap-3 items-center">
              <FontAwesomeIcon icon={faMapLocationDot} className="w-4 h-4 text-gray-700 flex-shrink-0" />
              <span className="text-sm text-left text-gray-800">{info.addr}</span>
            </div>
            {info.notes !== "" && (
              <div className="flex gap-3 items-center">
                <FontAwesomeIcon icon={faNoteSticky} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                <span className="text-sm text-left text-gray-800">{info.notes}</span>
              </div>
            )}
            <div className="flex gap-3 items-center">
              <FontAwesomeIcon icon={faEnvelopeCircleCheck} className="w-4 h-4 text-gray-700 flex-shrink-0" />
              <SourceInfo info={info} />
            </div>
            <div className="flex gap-3 items-center">
              <FontAwesomeIcon icon={faTags} className="w-4 h-4 text-gray-700 flex-shrink-0" />
              <span className="text-sm text-left text-gray-800">{info.tags}</span>
            </div>

            <ReactionBar info={info} />
          </div>
        </div>

        {/* Scroll indicator */}
        {showScrollHint && (
          <div className="absolute inset-x-0 bottom-16 z-10 flex justify-center pointer-events-none">
            <button 
              onClick={handleScrollDown}
              className="flex flex-col items-center animate-bounce pointer-events-auto"
              aria-label="Scroll untuk lihat lebih"
            >
              <span className="text-xs text-gray-600 bg-custom-yellow-2/90 px-2 py-1 rounded-full shadow-sm">Geser ke bawah</span>
              <FontAwesomeIcon icon={faChevronDown} className="text-gray-600" />
            </button>
          </div>
        )}

        <div className={MODAL_ACTIONS}>
          <button className={BTN_PRIMARY} onClick={() => openGoogleMaps(info)}>
            Buka di Google Maps
          </button>
        </div>
      </div>
    );
  }
}

export default KajianPopup;
