import { useEffect, useState, useRef, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faFilter, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { GET_ALL_KAJIAN, GET_LAST_UPDATE } from "../../services/api";
import SwalPopup from "../../components/swalPopup/index";
import { convertToYYYYMMDD, getDynamicCategory, ID_FormattedDate } from "../../utils/helpers";
import KajianMap from "components/kajianMap";

const Popup = withReactContent(Swal);

const Home = () => {
  const [data, setData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState();
  const [showAllInfo, setShowAllInfo] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDate, setShowDate] = useState("");
  const [mapCenter, setMapCenter] = useState(null);
  const [zoom, setZoom] = useState(12);
  const mapRef = useRef(null);

  const fetchData = async () => {
    try {
      const formattedDate = convertToYYYYMMDD(selectedDate);
      const result = await GET_ALL_KAJIAN(formattedDate);
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchLastUpdate = async () => {
    try {
      const getDate = await GET_LAST_UPDATE();
      const date = new Date(getDate.last_update.replace(" ", "T"));
      setLastUpdate(ID_FormattedDate(date));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchLastUpdate();
    localStorage.clear();
  }, []);

  useEffect(() => {
    fetchData();
    getUserLocation();
    setShowDate(ID_FormattedDate(selectedDate));
  }, [selectedDate]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setMapCenter(newLocation);
          setZoom(12);
        },
        (error) => {
          console.error("Error getting location:", error);
          const defaultLocation = { lat: -6.2088, lng: 106.8456 }; // Default to Jakarta
          setMapCenter(defaultLocation);
          setZoom(12);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      const defaultLocation = { lat: -6.2088, lng: 106.8456 }; // Default to Jakarta
      setMapCenter(defaultLocation);
      setZoom(12);
    }
  };

  const cities = useMemo(() => {
    const citySet = new Set();
    return data
      .filter((item) => {
        if (!citySet.has(item.city)) {
          citySet.add(item.city);
          return true;
        }
        return false;
      })
      .map((item) => item.city)
      .sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const cityMatch = selectedCity ? item.city === selectedCity : true;
      const itemTags = item.tags.split(",").map((tag) => tag.trim());
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.every((category) => itemTags.includes(category));
      return cityMatch && categoryMatch;
    });
  }, [data, selectedCity, selectedCategories]);

  useEffect(() => {
    if (filteredData.length > 0) {
      if (selectedCity) {
        const sumLat = filteredData.reduce((sum, item) => sum + item.lat, 0);
        const sumLng = filteredData.reduce((sum, item) => sum + item.lng, 0);
        const centerLat = sumLat / filteredData.length;
        const centerLng = sumLng / filteredData.length;
        setMapCenter({ lat: centerLat, lng: centerLng });
        setZoom(12);
      }
      getDynamicCategory(filteredData);
    }
  }, [filteredData, selectedCity]);

  const handleSetCenter = () => {
    getUserLocation();
    setSelectedCity("");
    setSelectedCategories([]);
  };

  const showInfo = () => {
    Popup.fire({
      html: <SwalPopup type="petunjuk" close={() => Popup.close()} />,
      showConfirmButton: false,
    });
  };

  const showFilter = () => {
    const filterProps = {
      filteredData,
      cities,
      selectedDate,
    };
    Popup.fire({
      html: (
        <SwalPopup
          type="filter"
          filter={filterProps}
          close={() => Popup.close()}
          submit={(res) => {
            setSelectedCity(res.city);
            setSelectedCategories(res.categories);
            setSelectedDate(res.date);
            Swal.close();
          }}
        />
      ),
      showConfirmButton: false,
    });
  };

  return (
    <div className="content">
      <div className="title-text mb-3 text-center text-custom-yellow-1 font-semibold text-sm md:text-base">{showDate}</div>

      {mapCenter && (
        <KajianMap locations={filteredData} ref={mapRef} showAllInfo={showAllInfo} center={[mapCenter.lat, mapCenter.lng]} zoom={zoom} />
      )}
      <div className="last-update text-sm text-center text-[#f1dcb7]">Terakhir Update: {lastUpdate}</div>

      <div className="action-area w-full flex flex-wrap justify-center items-center gap-2">
        <button
          onClick={showInfo}
          className="relative w-[36px] h-[36px] text-[40px] border-none rounded-full bg-custom-gray-1 text-custom-yellow-1 cursor-pointer overflow-hidden shadow-[inset_0_0_8px_-2px_#000]"
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <FontAwesomeIcon icon={faInfoCircle} />
          </span>
        </button>

        <button
          onClick={() => setShowAllInfo(!showAllInfo)}
          className="relative w-[36px] h-[36px] text-lg p-2 border-none rounded-full bg-custom-yellow-1 text-custom-gray-1 cursor-pointer overflow-hidden shadow-[inset_0_0_8px_-2px_#000]"
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {showAllInfo ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
          </span>
        </button>

        <button
          onClick={showFilter}
          className="relative w-[36px] h-[36px] text-lg p-2 border-none rounded-full bg-custom-yellow-1 text-custom-gray-1 cursor-pointer overflow-hidden shadow-[inset_0_0_8px_-2px_#000]"
          aria-label="Open filters"
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <FontAwesomeIcon icon={faFilter} className="text-sm" />
          </span>
        </button>

        <button
          onClick={handleSetCenter}
          className="my-3 py-2 px-6 border-none rounded-full bg-custom-yellow-1 text-custom-gray-1 font-semibold shadow-[inset_0_0_12px_-2px_#000]"
        >
          Lokasi Saya
        </button>
      </div>

      <div className="quotes text-center my-4 md:mt-12 mb-8 text-[12px] md:text-base">
        <i>Barangsiapa yang menempuh suatu jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan menuju surga. (HR. Muslim)</i>
      </div>
    </div>
  );
};

export default Home;
