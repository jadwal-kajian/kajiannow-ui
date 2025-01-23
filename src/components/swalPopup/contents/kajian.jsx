import React from "react";
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
} from "@fortawesome/free-solid-svg-icons";
import { formatDate, timeStartMapping } from "../../../utils/helpers";

function KajianPopup({ info, group, close }) {
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
                  <div className="flex gap-3 items-center">
                    <img src={`${import.meta.env.VITE_BASE_URL}/${info.src_image}`} alt="poster" />
                  </div>
                )}
                <div className="description space-y-2 p-3 pt-0">
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
        <div className="content max-h-[50vh] overflow-y-auto mx-2 bg-custom-yellow-3 rounded-xl">
          {info.src_image && (
            <div className="flex gap-3 items-center">
              <img src={`${import.meta.env.VITE_BASE_URL}/${info.src_image}`} alt="poster" className="rounded-xl" />
            </div>
          )}

          <div className="description space-y-2 p-3 pt-0">
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
