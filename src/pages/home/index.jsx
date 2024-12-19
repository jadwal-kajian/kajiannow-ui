import { useEffect, useState, useRef, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import MapParent from "components/mapParent/index";
import FilterButton from "components/filterButton/FilterButton";
import FilterModal from "components/filterButton/FilterModal";
import DateSelector from "components/dateSelector/index";
import { GET_ALL_KAJIAN } from "../../services/api";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SwalPopup from "components/swalPopup/index";
import { convertToYYYYMMDD } from "../../utils/helpers";

const Popup = withReactContent(Swal);

const Home = () => {
  const [data, setData] = useState([]);
  const [showAllInfo, setShowAllInfo] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [mapCenter, setMapCenter] = useState(null);
  const [zoom, setZoom] = useState(12);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
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

  useEffect(() => {
    fetchData();
    getUserLocation();
  }, [selectedDate]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setMapCenter(newLocation);
          setZoom(15);
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
      const categoryMatch =
        selectedCategories.length === 0 ||
        selectedCategories.every((category) => itemTags.includes(category));
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
    }
  }, [filteredData, selectedCity]);

  const handleSetCenter = () => {
    getUserLocation();
    setSelectedCity("");
    setSelectedCategories([]);
  };

  const handleCategoryChange = (categories) => {
    setSelectedCategories(categories);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const showInfo = () => {
    Popup.fire({
      html: <SwalPopup type="petunjuk" close={() => Popup.close()} />,
      showConfirmButton: false,
    });
  };

  return (
    <div className="content">
      <div className="action-area w-full flex flex-wrap justify-center items-center gap-2">
        <DateSelector selectedDate={selectedDate} onChange={handleDateChange} />
      </div>
      {mapCenter && (
        <MapParent
          locations={filteredData}
          ref={mapRef}
          showAllInfo={showAllInfo}
          center={mapCenter}
          zoom={zoom}
        />
      )}

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
            {showAllInfo ? (
              <FontAwesomeIcon icon={faEyeSlash} />
            ) : (
              <FontAwesomeIcon icon={faEye} />
            )}
          </span>
        </button>

        <FilterButton onClick={() => setIsFilterModalOpen(true)} />
        <button
          onClick={handleSetCenter}
          className="my-3 py-2 px-6 border-none rounded-full bg-custom-yellow-1 text-custom-gray-1 font-semibold shadow-[inset_0_0_12px_-2px_#000]"
        >
          Lokasi Saya
        </button>
      </div>

      <div className="quotes text-center my-4 md:mt-12 mb-8 text-[12px] md:text-base">
        <i>
          Barangsiapa yang menempuh suatu jalan untuk mencari ilmu, maka Allah
          akan memudahkan baginya jalan menuju surga. (HR. Muslim)
        </i>
      </div>

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        cities={cities}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        selectedCategories={selectedCategories}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  );
};

export default Home;
