import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faCalendar, faInfoCircle, faMosque, faNoteSticky, faUser, faMapLocationDot, faPhone } from "@fortawesome/free-solid-svg-icons";
import "./style.scss";

const timeStartMapping = {
  bada_subuh: "Ba'da Subuh",
  bada_dzuhur: "Ba'da Dzuhur",
  bada_ashar: "Ba'da Ashar",
  bada_maghrib: "Ba'da Maghrib",
  bada_isya: "Ba'da Isya'",
  };

function SwalPopup(data) {
  const { type, info, group, close } = data;

  const openGoogleMaps = (info) => {
    if (info.gmaps_url) {
      window.open(info.gmaps_url, "_blank");
    } else if (info.lat && info.lng) {
      window.open(`https://www.google.com/maps?q=${info.lat},${info.lng}`, "_blank");
    } else
    {
      const placeName = info.loc_name;
      const address = info.addr;
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName + ' ' + address)}`, "_blank");
    }
  };

  if (type == "kajian") {
    if (group.length > 1) {
      return (
        <div className="relative max-h-[500px] overflow-y-auto flex flex-col text-center text-base py-2 bg-[#ffe7be] shadow-[inset_0_0_20px_-2px_#000]">
          {group.map((info, i) => (
            <div key={i} className="group-item mx-2">
              <div className="title pb-2 font-semibold p-3">{info.topic}</div>
              <div className="content p-3">
                <div className="speaker">
                  <FontAwesomeIcon icon={faUser} />
                  <span className="label mx-2">{info.speaker}</span>
                </div>
                <div className="place">
                  <FontAwesomeIcon icon={faMosque} />
                  <span className="label mx-2">{info.loc_name}</span>
                </div>
                <div className="address">
                  <FontAwesomeIcon icon={faMapLocationDot} />
                  <span className="label mx-2">{info.addr}</span>
                </div>
                <div className="time">
                  <FontAwesomeIcon icon={faCalendar} />
                  <span className="label mx-2">
                  {timeStartMapping[info.time_start] || info.time_start} - {info.time_end}
                  </span>
                </div>
                <div className="contact">
                  <FontAwesomeIcon icon={faPhone} />
                  <span className="label mx-2">{info.contact}</span>
                </div>
                <div className="notes">
                  <FontAwesomeIcon icon={faNoteSticky} />
                  <span className="label mx-2">{info.notes !== "Cp : -" && info.notes}</span>
                </div>
              </div>
              <div className="action-area flex gap-2 justify-center items-center p-3 text-sm font-semibold">
                <button
                  className="confirm p-2 px-4 rounded-full bg-[#edce93]"
                  onClick={() => openGoogleMaps(info)}
                >
                  Buka di Google Maps
                </button>
              </div>
              <div className={`divider h-[1px] w-[95%] mx-auto bg-[burlywood]`}></div>
            </div>
          ))}

          <button
            className="cancel w-[100px] mx-auto my-4 p-2 px-4 rounded-full bg-[#efd8ad] text-sm font-semibold"
            onClick={close}
          >
            Tutup
          </button>
        </div>
      );
    } else {
      return (
        <div className="relative flex flex-col text-center text-base py-2 bg-[#ffe7be] shadow-[inset_0_0_20px_-2px_#000]">
          <div className="title pb-2 font-semibold p-3">{info.topic}</div>
          <div className="content p-3">
            <div className="speaker">
              <FontAwesomeIcon icon={faUser} />
              <span className="label mx-2">{info.speaker}</span>
            </div>
            <div className="place">
              <FontAwesomeIcon icon={faMosque} />
              <span className="label mx-2">{info.loc_name}</span>
            </div>
            <div className="address">
              <FontAwesomeIcon icon={faMapLocationDot} />
              <span className="label mx-2">{info.addr}</span>
            </div>
            <div className="time">
              <FontAwesomeIcon icon={faCalendar} />
              <span className="label mx-2">
                {timeStartMapping[info.time_start] || info.time_start} - {info.time_end}
              </span>
            </div>
            <div className="contact">
              <FontAwesomeIcon icon={faPhone} />
              <span className="label mx-2">{info.contact}</span>
            </div>
            {info.notes !== "Cp : -" && (
              <div className="notes">
                <FontAwesomeIcon icon={faNoteSticky} />
                <span className="label mx-2">{info.notes}</span>
              </div>
            )}
          </div>
          <div className="action-area flex gap-2 justify-center items-center p-3 text-sm font-semibold">
            <button
              className="confirm p-2 px-4 rounded-full bg-[#edce93]"
              onClick={() => openGoogleMaps(info)}
            >
              Buka di Google Maps
            </button>
            <button className="cancel p-2 px-4 rounded-full bg-[#efd8ad] text-sm font-semibold" onClick={close}>
              Tutup
            </button>
          </div>
        </div>
      );
    }
  } else {
    return (
      <div className="relative flex flex-col text-center text-base py-2 bg-[#ffe7be] shadow-[inset_0_0_20px_-2px_#000]">
        <div className="title pb-2 font-semibold p-3">
          <FontAwesomeIcon icon={faInfoCircle} />
          <span className="label mx-2">Petunjuk</span>
        </div>
        <div className="content p-3 max-w-[90%] md:max-w-full mx-auto flex flex-col gap-2 text-sm md:text-base">
          <div className="item-info">
            <FontAwesomeIcon icon={faBook} />
            <span className="desc mx-2">Pinpoint merah menunjukkan lokasi kajian</span>
          </div>
          <div className="item-info">
            <FontAwesomeIcon icon={faBook} />
            <span className="desc mx-2">Klik pinpoint untuk melihat detail info kajian</span>
          </div>
        </div>
        <div className="action-area flex gap-2 justify-center items-center p-3 text-sm font-semibold">
          <button className="cancel p-2 px-4 rounded-full bg-[#efd8ad] text-sm font-semibold" onClick={close}>
            Tutup
          </button>
        </div>
      </div>
    );
  }
}

export default SwalPopup;
