import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faCalendar,
  faInfoCircle,
  faMosque,
  faNoteSticky,
  faUser,
  faMapLocationDot,
  faPhone,
  faTimes,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { convertDateTime } from "../../utils/helpers";
import CityFilter from "../../components/cityFilter";
import "./style.scss";

const timeStartMapping = {
  bada_subuh: "Ba'da Subuh",
  bada_dzuhur: "Ba'da Dzuhur",
  bada_ashar: "Ba'da Ashar",
  bada_maghrib: "Ba'da Maghrib",
  bada_isya: "Ba'da Isya'",
};

function SwalPopup(data) {
  const { type, info, group, close, filter } = data;
  // console.log(data);

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

  if (type == "kajian") {
    if (group.length > 1) {
      return (
        <div className="relative max-h-[500px] overflow-y-auto flex flex-col text-center text-base py-2 bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]">
          <button
            className="sticky top-3 right-6 ml-auto px-2 p-[6px] bg-custom-yellow-4 text-gray-600 hover:text-gray-800 rounded-full flex items-center justify-center z-10 shadow-[0_0_8px_-4px_#000]"
            onClick={close}
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>

          {group.map((info, i) => (
            <div key={i} className="group-item mx-3 mb-4">
              <div className="relative md:mx-6 px-3 pb-[50px] bg-custom-yellow-3 rounded-xl overflow-hidden">
                <div className="title text-sm font-semibold p-2">{info.topic}</div>

                <div className="content flex flex-col gap-[5px]">
                  <div className="flex gap-3 items-center">
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                    <span className="text-[13px] text-left text-gray-800">{info.speaker}</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <FontAwesomeIcon icon={faMosque} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                    <span className="text-[13px] text-left text-gray-800">{info.loc_name}</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-gray-700 flex-shrink-0" />
                    <span className="text-[13px] text-left text-gray-800">{convertDateTime(info.date)}</span>
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
          <div className="title font-semibold p-3 pl-4 pb-2 text-sm md:text-base">{info.topic}</div>
          <div className="content mx-3 space-y-2 md:mx-6 p-3 bg-custom-yellow-3 rounded-xl">
            <div className="flex gap-3 items-center">
              <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-700 flex-shrink-0" />
              <span className="text-sm text-left text-gray-800">{info.speaker}</span>
            </div>
            <div className="flex gap-3 items-center">
              <FontAwesomeIcon icon={faMosque} className="w-4 h-4 text-gray-700 flex-shrink-0" />
              <span className="text-sm text-left text-gray-800">{info.loc_name}</span>
            </div>
            <div className="flex gap-3 items-center">
              <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-gray-700 flex-shrink-0" />
              <span className="text-[13px] text-left text-gray-800">{convertDateTime(info.date)}</span>
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
  } else if (type == "filter") {
    console.log(data);
    return (
      <div className="relative max-h-[500px] overflow-y-auto flex flex-col text-center text-base py-2 bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]">
        <button
          className="sticky top-3 right-6 ml-auto px-2 p-[6px] bg-custom-yellow-4 text-gray-600 hover:text-gray-800 rounded-full flex items-center justify-center z-10 shadow-[0_0_8px_-4px_#000]"
          onClick={close}
        >
          <FontAwesomeIcon icon={faTimes} size="lg" />
        </button>
        <div className="content p-3 max-w-[90%] md:max-w-full mx-auto flex flex-col gap-2 text-[13px] md:text-base">
          <CityFilter cities={filter.cities} selectedCity={filter.selectedCity} onCityChange={filter.onCityChange} />
          {/* <CategoryFilter selectedCategories={selectedCategories} onCategoryChange={onCategoryChange} /> */}
        </div>
      </div>
    );
  } else {
    return (
      <div className="relative flex flex-col text-center text-base py-2 bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000]">
        <div className="title pb-2 font-semibold p-3">
          <FontAwesomeIcon icon={faInfoCircle} />
          <span className="label mx-2">Petunjuk</span>
        </div>
        <div className="content p-3 max-w-[90%] md:max-w-full mx-auto flex flex-col gap-2 text-[13px] md:text-base">
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
