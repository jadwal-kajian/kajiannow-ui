import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faFilter, faInfoCircle, faCommentDots, faChevronLeft, faChevronRight, faBell } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { GET_ALL_KAJIAN, GET_LAST_UPDATE } from "../../services/api";
import SwalPopup from "../../components/swalPopup/index";
import { convertToYYYYMMDD, getDynamicCategory, ID_FormattedDate } from "../../utils/helpers";
import KajianMap from "components/kajianMap";
import LocationErrorPopup from "../../components/swalPopup/contents/locationError";
import LocationLoadingPopup from "../../components/swalPopup/contents/locationLoading";
import LaporPopup from "../../components/swalPopup/contents/lapor";
import NotifySettingsPopup from "../../components/swalPopup/contents/notifySettings";
import { useGeolocation, isInAppBrowser } from "../../hooks/useGeolocation";
import { useNearbyKajianNotifications } from "../../hooks/useNearbyKajianNotifications";

const Popup = withReactContent(Swal);

const DEFAULT_LOCATION = { lat: -6.2088, lng: 106.8456 }; // Jakarta

// Nearby-kajian notification preferences (persisted across the on-mount cache clear).
const NOTIFY_KEY = "kn_notify_settings";
const DEFAULT_NOTIFY = { enabled: false, radiusKm: 5, leadMinutes: 60 };

const readNotifySettings = () => {
  try {
    const raw = localStorage.getItem(NOTIFY_KEY);
    return raw ? { ...DEFAULT_NOTIFY, ...JSON.parse(raw) } : DEFAULT_NOTIFY;
  } catch {
    return DEFAULT_NOTIFY;
  }
};

// Cache for user location to avoid repeated geolocation calls
const locationCache = {
  coords: null,
  timestamp: null,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes cache
  isValid() {
    return this.coords && this.timestamp && (Date.now() - this.timestamp < this.CACHE_DURATION);
  },
  set(coords) {
    this.coords = coords;
    this.timestamp = Date.now();
  },
  get() {
    return this.coords;
  },
  clear() {
    this.coords = null;
    this.timestamp = null;
  }
};

const Home = () => {
  const [data, setData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState();
  const [showAllInfo, setShowAllInfo] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDate, setShowDate] = useState("");
  const [mapCenter, setMapCenter] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [zoom, setZoom] = useState(12);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef(null);
  const locatingRef = useRef(false); // synchronous guard against overlapping requests
  const { locate } = useGeolocation();
  const [notifySettings, setNotifySettings] = useState(readNotifySettings);

  // Browser-notify about nearby kajian starting soon (while the tab is open).
  useNearbyKajianNotifications({
    enabled: notifySettings.enabled,
    radiusKm: notifySettings.radiusKm,
    leadMinutes: notifySettings.leadMinutes,
    data,
    userLocation,
  });

  const applyLocation = useCallback((location) => {
    setUserLocation(location);
    setMapCenter(location);
    setZoom(12);
  }, []);

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
    // Clear stale caches but keep the user's notification preferences.
    const savedNotify = localStorage.getItem(NOTIFY_KEY);
    localStorage.clear();
    if (savedNotify != null) localStorage.setItem(NOTIFY_KEY, savedNotify);
  }, []);

  // Initial location fetch - only once on mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Fetch data when date changes
  useEffect(() => {
    fetchData();
    setShowDate(ID_FormattedDate(selectedDate));
  }, [selectedDate]);

  const getUserLocation = useCallback((forceRefresh = false, requestHighAccuracy = false) => {
    // Prevent duplicate requests (ref is synchronous — guards rapid double-clicks
    // that the isLocating state update would be too slow to catch).
    if (locatingRef.current) {
      return;
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh && locationCache.isValid()) {
      applyLocation(locationCache.get());
      return;
    }

    locatingRef.current = true;
    setIsLocating(true);

    Popup.fire({
      html: <LocationLoadingPopup />,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    // The first fix dismisses the spinner so the UI never feels stuck; any later
    // high-accuracy refinement nudges the map quietly in the background.
    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      locatingRef.current = false;
      setIsLocating(false);
      Popup.close();
    };

    locate({
      highAccuracy: requestHighAccuracy,
      onFix: (location, { isFinal }) => {
        dismiss();
        applyLocation(location);
        if (isFinal) locationCache.set(location);
      },
      onError: (error) => {
        dismiss();
        handleGeolocationError(error);
      },
    });
  }, [locate, applyLocation]);

  // Handle geolocation errors in a single function
  const handleGeolocationError = (error) => {
    // Always close the spinner first
    Popup.close();
    console.error("Error getting location:", error);

    // Show error message to the user
    Popup.fire({
      html: (
        <LocationErrorPopup
          message={
            error.code === -1
              ? 'Perangkat Anda tidak mendukung akses lokasi.'
              : isInAppBrowser()
              ? 'Lokasi sulit didapat di dalam aplikasi (mis. Threads/Instagram). Buka halaman ini di browser (Chrome/Safari) lalu izinkan akses lokasi.'
              : 'Mohon izinkan akses lokasi Anda di perangkat dan browser/aplikasi Anda agar kami bisa mengarahkan peta ke lokasi Anda.'
          }
          onRetry={() => window.location.reload()}
          onClose={() => Popup.close()}
        />
      ),
      showConfirmButton: false,
      allowOutsideClick: true,
    });

    // Fallback to the default location
    setMapCenter(DEFAULT_LOCATION);
    setZoom(12);
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

  // Kajian count per city for the loaded date — shown beside each option in the city filter.
  const cityCounts = useMemo(() => {
    const counts = {};
    for (const item of data) counts[item.city] = (counts[item.city] || 0) + 1;
    return counts;
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
    // Force refresh location with high accuracy when user clicks "Lokasi Saya"
    locationCache.clear();
    getUserLocation(true, true); // forceRefresh=true, requestHighAccuracy=true
    setSelectedCity("");
    setSelectedCategories([]);
  };

  const showInfo = () => {
    Popup.fire({
      html: <SwalPopup type="petunjuk" close={() => Popup.close()} />,
      showConfirmButton: false,
    });
  };

  // Shift the selected date by whole days (negative = back, positive = forward).
  const changeDay = (delta) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta);
      return next;
    });
  };

  const showFilter = () => {
    const filterProps = {
      filteredData,
      allData: data,
      cities,
      cityCounts,
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

  const showReport = () => {
    Popup.fire({
      html: <LaporPopup close={() => Popup.close()} />,
      showConfirmButton: false,
    });
  };

  const saveNotifySettings = (next) => {
    setNotifySettings(next);
    try {
      localStorage.setItem(NOTIFY_KEY, JSON.stringify(next));
    } catch {
      // ignore storage failures (private mode, quota) — settings still apply this session
    }
    Popup.close();
  };

  const showNotifySettings = () => {
    Popup.fire({
      html: (
        <NotifySettingsPopup
          settings={notifySettings}
          onSave={saveNotifySettings}
          close={() => Popup.close()}
        />
      ),
      showConfirmButton: false,
    });
  };

  return (
    <div className="content">
      {/* Test-observable geolocation state (hidden; harmless in production) */}
      <div
        data-testid="geo-state"
        data-locating={isLocating ? "1" : "0"}
        data-user-lat={userLocation?.lat ?? ""}
        data-user-lng={userLocation?.lng ?? ""}
        data-center-lat={mapCenter?.lat ?? ""}
        data-center-lng={mapCenter?.lng ?? ""}
        style={{ display: "none" }}
      />
      <div className="date-nav mb-3 flex items-center justify-center gap-2 select-none">
        <button
          onClick={() => changeDay(-1)}
          aria-label="Hari sebelumnya"
          className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full bg-custom-yellow-1 text-custom-gray-1 shadow-[inset_0_0_8px_-2px_#000] active:scale-90 transition-transform"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <button
          onClick={showFilter}
          aria-label="Pilih tanggal"
          className="min-w-0 flex-shrink px-4 h-11 flex items-center rounded-full bg-white/5 ring-1 ring-custom-yellow-1/40 text-custom-yellow-1 font-semibold text-sm md:text-base whitespace-nowrap truncate active:scale-95 transition-transform"
        >
          {showDate}
        </button>
        <button
          onClick={() => changeDay(1)}
          aria-label="Hari berikutnya"
          className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full bg-custom-yellow-1 text-custom-gray-1 shadow-[inset_0_0_8px_-2px_#000] active:scale-90 transition-transform"
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>

      {mapCenter && (
        <KajianMap 
          locations={filteredData} 
          ref={mapRef} 
          showAllInfo={showAllInfo} 
          center={[mapCenter.lat, mapCenter.lng]} 
          zoom={zoom}
          userLocation={userLocation ? [userLocation.lat, userLocation.lng] : null}
        />
      )}
      <div className="last-update text-sm text-center text-[#f1dcb7]">Terakhir Update: {lastUpdate}</div>

      <div className="action-area w-full flex flex-wrap justify-center items-center gap-2">
        <button
          onClick={showInfo}
          className="relative w-11 h-11 text-[40px] border-none rounded-full bg-custom-gray-1 text-custom-yellow-1 cursor-pointer overflow-hidden shadow-[inset_0_0_8px_-2px_#000]"
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <FontAwesomeIcon icon={faInfoCircle} />
          </span>
        </button>

        <button
          onClick={() => setShowAllInfo(!showAllInfo)}
          className="relative w-11 h-11 text-lg p-2 border-none rounded-full bg-custom-yellow-1 text-custom-gray-1 cursor-pointer overflow-hidden shadow-[inset_0_0_8px_-2px_#000]"
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {showAllInfo ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
          </span>
        </button>

        <button
          onClick={showFilter}
          className="relative w-11 h-11 text-lg p-2 border-none rounded-full bg-custom-yellow-1 text-custom-gray-1 cursor-pointer overflow-hidden shadow-[inset_0_0_8px_-2px_#000]"
          aria-label="Open filters"
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <FontAwesomeIcon icon={faFilter} className="text-sm" />
          </span>
        </button>

        <button
          onClick={showReport}
          className="relative w-11 h-11 text-lg p-2 border-none rounded-full bg-custom-yellow-1 text-custom-gray-1 cursor-pointer overflow-hidden shadow-[inset_0_0_8px_-2px_#000]"
          aria-label="Report issue"
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <FontAwesomeIcon icon={faCommentDots} className="text-sm" />
          </span>
        </button>

        <button
          onClick={showNotifySettings}
          className={`relative w-11 h-11 text-lg p-2 border-none rounded-full cursor-pointer overflow-hidden shadow-[inset_0_0_8px_-2px_#000] ${
            notifySettings.enabled ? "bg-custom-gray-1 text-custom-yellow-1" : "bg-custom-yellow-1 text-custom-gray-1"
          }`}
          aria-label="Pengaturan notifikasi kajian terdekat"
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <FontAwesomeIcon icon={faBell} className="text-sm" />
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
