import React, { useState, useRef, useEffect } from "react";
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
} from "@fortawesome/free-solid-svg-icons";
import { formatDate, timeStartMapping } from "../../../utils/helpers";

function KajianPopup({ info, group, close }) {
  // Hooks must be at top level - used for single item scroll indicator
  const scrollRef = useRef(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  useEffect(() => {
    // Only run for single item view
    if (group.length > 1) return;

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

  if (group.length > 1) {
    return (
      <div className="relative max-h-[500px] overflow-y-auto flex flex-col text-center text-base py-2 bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]">
        <button
          className="sticky top-1 right-4 ml-auto px-2 p-[6px] bg-custom-yellow-4 text-gray-600 hover:text-gray-800 rounded-full flex items-center justify-center z-10 shadow-[0_0_8px_-4px_#000]"
          onClick={close}
        >
          <FontAwesomeIcon icon={faTimes} size="lg" />
        </button>

        {group.map((info, i) => (
          <div key={i} className="group-item mb-4">
            <div className="relative mx-2 pb-[50px] bg-custom-yellow-3 rounded-xl overflow-hidden shadow-[0_0_4px_-2px_#000]">
              <div className="content flex flex-col gap-[5px]">
                {info.src_image && (
                  <div className="relative flex gap-3 items-center">
                    <img 
                      src={`${import.meta.env.VITE_BASE_URL}/${info.src_image}`} 
                      alt="poster" 
                      className="w-full object-cover max-h-[30vh]"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-custom-yellow-3 to-transparent pointer-events-none" />
                  </div>
                )}
                <div className="description space-y-2 p-3">
                  <div className="title text-sm font-semibold p-2">{info.topic}</div>
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
                      {timeStartMapping[info.time_start] || info.time_start} - {info.time_end || "Selesai"}
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
                    <span className="text-sm text-left text-gray-800">
                      {info.src_text && (
                        <a
                          href={`${import.meta.env.VITE_BASE_URL}/${info.src_text}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Teks
                        </a>
                      )}
                      {info.src_image && (
                        <a
                          href={`${import.meta.env.VITE_BASE_URL}/${info.src_image}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Gambar
                        </a>
                      )}
                      <span className="mx-1">
                        dari {info.src_sender_name} ({info.src_sender_contact}) via {info.src_platform}
                      </span>
                    </span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <FontAwesomeIcon icon={faTags} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                    <span className="text-sm text-left text-gray-800">{info.tags}</span>
                  </div>
                </div>
              </div>

              <button
                className="open-gmap absolute left-0 bottom-0 w-full text-[12px] font-semibold p-1 bg-custom-yellow-2"
                onClick={() => openGoogleMaps(info)}
              >
                Buka di Google Maps
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    return (
      <div className="relative flex flex-col text-base py-2 bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]">
        <div 
          ref={scrollRef}
          className="content max-h-[60vh] overflow-y-auto mx-2 bg-custom-yellow-3 rounded-xl scroll-smooth"
        >
          {info.src_image && (
            <div className="relative flex gap-3 items-center">
              <img 
                src={`${import.meta.env.VITE_BASE_URL}/${info.src_image}`} 
                alt="poster" 
                className="rounded-t-xl w-full object-cover max-h-[35vh]" 
              />
              {/* Gradient overlay to hint there's content below */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-custom-yellow-3 to-transparent pointer-events-none" />
            </div>
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
                {timeStartMapping[info.time_start] || info.time_start} - {info.time_end || "Selesai"}
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
              <span className="text-sm text-left text-gray-800">
                {info.src_text && (
                  <a
                    href={`${import.meta.env.VITE_BASE_URL}/${info.src_text}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Teks
                  </a>
                )}
                {info.src_image && (
                  <a
                    href={`${import.meta.env.VITE_BASE_URL}/${info.src_image}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Gambar
                  </a>
                )}
                <span className="mx-1">
                  dari {info.src_sender_name} ({info.src_sender_contact}) via {info.src_platform}
                </span>
              </span>
            </div>
            <div className="flex gap-3 items-center">
              <FontAwesomeIcon icon={faTags} className="w-4 h-4 text-gray-700 flex-shrink-0" />
              <span className="text-sm text-left text-gray-800">{info.tags}</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        {showScrollHint && (
          <button 
            onClick={handleScrollDown}
            className="absolute left-1/2 -translate-x-1/2 bottom-16 z-10 flex flex-col items-center animate-bounce"
            aria-label="Scroll untuk lihat lebih"
          >
            <span className="text-xs text-gray-600 bg-custom-yellow-2/90 px-2 py-1 rounded-full shadow-sm">Geser ke bawah</span>
            <FontAwesomeIcon icon={faChevronDown} className="text-gray-600" />
          </button>
        )}

        <div className="action-area flex gap-2 justify-center items-center p-3 text-sm font-semibold">
          <button className="confirm p-2 px-4 rounded-full bg-[#edce93]" onClick={() => openGoogleMaps(info)}>
            Buka di Google Maps
          </button>
          <button className="cancel p-2 px-4 rounded-full bg-custom-yellow-3 text-sm font-semibold" onClick={close}>
            Tutup
          </button>
        </div>
      </div>
    );
  }
}

export default KajianPopup;
