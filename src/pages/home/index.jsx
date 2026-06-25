import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faFilter, faInfoCircle, faCommentDots, faChevronLeft, faChevronRight, faBell, faSpinner, faCalendarXmark, faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { GET_ALL_KAJIAN, GET_LAST_UPDATE } from "../../services/api";
import SwalPopup from "../../components/swalPopup/index";
import { convertToYYYYMMDD, ID_FormattedDate, groupTopicsByLocation } from "../../utils/helpers";
import KajianMap from "components/kajianMap";
import { ShowPopupInfo } from "../../components/kajianMap/ShowPopupInfo";
import LocationErrorPopup from "../../components/swalPopup/contents/locationError";
import LocationLoadingPopup from "../../components/swalPopup/contents/locationLoading";
import LaporPopup from "../../components/swalPopup/contents/lapor";
import NotifySettingsPopup from "../../components/swalPopup/contents/notifySettings";
import { useGeolocation, isInAppBrowser } from "../../hooks/useGeolocation";
import { useNearbyKajianNotifications } from "../../hooks/useNearbyKajianNotifications";
import { usePushSubscription } from "../../hooks/usePushSubscription";
import { REACTIONS_KEY } from "../../utils/reactions";

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

// Notification deep link: ?k=<id>&d=<YYYY-MM-DD>&lat=&lng= (emitted by the
// nearby-kajian notification). Read once on load to open the kajian's flyer and
// center the map on it. Returns null when no deep link is present.
const readDeepLink = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("k");
    if (!id) return null;
    const lat = parseFloat(params.get("lat"));
    const lng = parseFloat(params.get("lng"));
    return {
      id,
      date: params.get("d") || null,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
    };
  } catch {
    return null;
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
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState();
  const [showAllInfo, setShowAllInfo] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  // A pending notification deep link (kajian to auto-open), captured once on mount.
  const deepLinkRef = useRef(readDeepLink());
  // Once the deep-linked kajian is centered, keep the map there (don't let a late
  // geolocation fix yank it back to the user's location).
  const deepLinkDoneRef = useRef(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const dl = deepLinkRef.current;
    if (dl?.date) {
      const parsed = new Date(`${dl.date}T00:00:00`);
      if (!isNaN(parsed)) return parsed;
    }
    return new Date();
  });
  const [showDate, setShowDate] = useState("");
  const [mapCenter, setMapCenter] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [zoom, setZoom] = useState(12);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef(null);
  const locatingRef = useRef(false); // synchronous guard against overlapping requests
  const { locate } = useGeolocation();
  const [notifySettings, setNotifySettings] = useState(readNotifySettings);
  const push = usePushSubscription();

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
    // Keep the map on a deep-linked kajian; only the user marker tracks location.
    if (deepLinkDoneRef.current) return;
    setMapCenter(location);
    setZoom(12);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const formattedDate = convertToYYYYMMDD(selectedDate);
      const result = await GET_ALL_KAJIAN(formattedDate);
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setData([]);
    } finally {
      setLoading(false);
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
    // Clear stale caches but keep settings that must survive reloads.
    const keep = [NOTIFY_KEY, REACTIONS_KEY].map((k) => [k, localStorage.getItem(k)]);
    localStorage.clear();
    keep.forEach(([k, v]) => { if (v != null) localStorage.setItem(k, v); });
  }, []);

  // Initial location fetch - only once on mount. When following a notification
  // deep link, run silently: no loading spinner and no Popup.close(), so the
  // geolocation flow can't clobber the kajian flyer we're about to open.
  useEffect(() => {
    getUserLocation(false, false, !!deepLinkRef.current);
  }, []);

  // Fetch data when date changes
  useEffect(() => {
    fetchData();
    setShowDate(ID_FormattedDate(selectedDate));
  }, [selectedDate]);

  // Strip the deep-link query once captured so a refresh / popup reopen won't retrigger it.
  useEffect(() => {
    if (deepLinkRef.current) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Notification deep link: once the target kajian is loaded, center the map on it
  // and open its flyer. Matches by id, falling back to lat/lng from the link.
  useEffect(() => {
    const dl = deepLinkRef.current;
    if (!dl || !Array.isArray(data) || data.length === 0) return;

    const item =
      data.find((it) => it.id != null && String(it.id) === String(dl.id)) ||
      (dl.lat != null && dl.lng != null
        ? data.find((it) => it.lat === dl.lat && it.lng === dl.lng)
        : null);
    if (!item) return;

    deepLinkRef.current = null;
    deepLinkDoneRef.current = true;
    setMapCenter({ lat: item.lat, lng: item.lng });
    setZoom(16);
    ShowPopupInfo({ location: item, group: groupTopicsByLocation(item.lat, item.lng, data) });
  }, [data]);

  const getUserLocation = useCallback((forceRefresh = false, requestHighAccuracy = false, silent = false) => {
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

    // Silent mode (notification deep link) skips the spinner so it can never
    // share — and later close — the SweetAlert singleton the flyer uses.
    if (!silent) {
      Popup.fire({
        html: <LocationLoadingPopup />,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
    }

    // The first fix dismisses the spinner so the UI never feels stuck; any later
    // high-accuracy refinement nudges the map quietly in the background.
    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      locatingRef.current = false;
      setIsLocating(false);
      if (!silent) Popup.close();
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
        // Don't pop an error dialog over the deep-linked flyer; just fall back
        // to the default center if we haven't already centered on the kajian.
        if (silent) {
          if (!deepLinkDoneRef.current) {
            setMapCenter(DEFAULT_LOCATION);
            setZoom(12);
          }
          return;
        }
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
    }
  }, [filteredData, selectedCity]);

  const hasActiveFilters = !!selectedCity || selectedCategories.length > 0;

  // Relative-day label for the selected date (Kemarin / Hari ini / Besok), or null.
  const dayLabel = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / 86400000);
    if (diff === 0) return "Hari ini";
    if (diff === 1) return "Besok";
    if (diff === -1) return "Kemarin";
    return null;
  }, [selectedDate]);

  const clearFilters = () => {
    setSelectedCity("");
    setSelectedCategories([]);
    try {
      localStorage.removeItem("filter");
    } catch {
      // ignore storage failures
    }
  };

  const handleSetCenter = () => {
    // Force refresh location with high accuracy when user clicks "Lokasi Saya"
    locationCache.clear();
    // Release the deep-link lock: the user is explicitly asking to recenter on
    // their own location, so let applyLocation move the map off the kajian that
    // a notification deep link had pinned it to.
    deepLinkDoneRef.current = false;
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
          userLocation={userLocation}
          push={push}
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

      {/* Result summary: how many kajian are shown for the chosen date/filters. */}
      <div className="results-bar mb-2 flex items-center justify-center gap-2 text-sm min-h-[20px]">
        {loading ? (
          <span className="flex items-center gap-2 text-[#f1dcb7]">
            <FontAwesomeIcon icon={faSpinner} spin />
            Memuat kajian…
          </span>
        ) : (
          <span className="text-[#f1dcb7]">
            <span className="font-bold text-custom-yellow-1">{filteredData.length}</span> kajian
            {hasActiveFilters ? " (tersaring)" : " ditampilkan"}
            {dayLabel && <span className="text-[#f1dcb7]/70"> • {dayLabel}</span>}
          </span>
        )}
      </div>

      {mapCenter && (
        <div className="relative">
          <KajianMap
            locations={filteredData}
            ref={mapRef}
            showAllInfo={showAllInfo}
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={zoom}
            userLocation={userLocation ? [userLocation.lat, userLocation.lng] : null}
          />
          {/* Empty state — nothing to show for this date/filter. */}
          {!loading && filteredData.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center p-4">
              <div className="pointer-events-auto max-w-[300px] rounded-2xl bg-black/75 backdrop-blur-sm px-5 py-4 text-center shadow-[0_8px_24px_-6px_#000]">
                <FontAwesomeIcon icon={faCalendarXmark} className="text-2xl text-custom-yellow-1" />
                <p className="mt-2 font-semibold text-custom-yellow-1">
                  {hasActiveFilters ? "Tidak ada kajian yang cocok" : "Belum ada kajian pada tanggal ini"}
                </p>
                <p className="mt-1 text-[12px] text-[#f1dcb7]/80">
                  {hasActiveFilters
                    ? "Coba ubah atau hapus filter Anda."
                    : "Coba pilih tanggal lain atau periksa kembali nanti."}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-3 rounded-full bg-custom-yellow-1 px-4 py-1.5 text-[12px] font-semibold text-custom-gray-1 active:scale-95 transition-transform"
                  >
                    Hapus filter
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="last-update text-sm text-center text-[#f1dcb7] mt-3">Terakhir Update: {lastUpdate}</div>

      <div className="action-area w-full flex flex-wrap justify-center items-center gap-2">
        <button
          onClick={showInfo}
          title="Petunjuk penggunaan"
          aria-label="Petunjuk penggunaan"
          className="relative w-11 h-11 text-[40px] border-none rounded-full bg-custom-gray-1 text-custom-yellow-1 cursor-pointer overflow-hidden shadow-[inset_0_0_8px_-2px_#000] active:scale-90 transition-transform"
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <FontAwesomeIcon icon={faInfoCircle} />
          </span>
        </button>

        <button
          onClick={() => setShowAllInfo(!showAllInfo)}
          title={showAllInfo ? "Sembunyikan semua info" : "Tampilkan semua info"}
          aria-label={showAllInfo ? "Sembunyikan semua info" : "Tampilkan semua info"}
          aria-pressed={showAllInfo}
          className={`relative w-11 h-11 text-lg p-2 border-none rounded-full cursor-pointer overflow-hidden shadow-[inset_0_0_8px_-2px_#000] active:scale-90 transition-transform ${
            showAllInfo ? "bg-custom-gray-1 text-custom-yellow-1" : "bg-custom-yellow-1 text-custom-gray-1"
          }`}
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {showAllInfo ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
          </span>
        </button>

        <button
          onClick={showFilter}
          title="Saring & pilih tanggal"
          className={`relative w-11 h-11 text-lg p-2 border-none rounded-full cursor-pointer overflow-hidden shadow-[inset_0_0_8px_-2px_#000] active:scale-90 transition-transform ${
            hasActiveFilters
              ? "bg-custom-gray-1 text-custom-yellow-1 outline outline-2 outline-offset-1 outline-green-400"
              : "bg-custom-yellow-1 text-custom-gray-1"
          }`}
          aria-label="Saring kajian dan pilih tanggal"
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <FontAwesomeIcon icon={faFilter} className="text-sm" />
          </span>
        </button>

        <button
          onClick={showReport}
          title="Lapor / pesan ke pengembang"
          className="relative w-11 h-11 text-lg p-2 border-none rounded-full bg-custom-yellow-1 text-custom-gray-1 cursor-pointer overflow-hidden shadow-[inset_0_0_8px_-2px_#000] active:scale-90 transition-transform"
          aria-label="Lapor atau kirim pesan ke pengembang"
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <FontAwesomeIcon icon={faCommentDots} className="text-sm" />
          </span>
        </button>

        <button
          onClick={showNotifySettings}
          title="Notifikasi kajian terdekat"
          className={`relative w-11 h-11 text-lg p-2 border-none rounded-full cursor-pointer overflow-hidden shadow-[inset_0_0_8px_-2px_#000] active:scale-90 transition-transform ${
            notifySettings.enabled
              ? "bg-custom-gray-1 text-custom-yellow-1 outline outline-2 outline-offset-1 outline-green-400"
              : "bg-custom-yellow-1 text-custom-gray-1"
          }`}
          aria-label="Pengaturan notifikasi kajian terdekat"
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <FontAwesomeIcon icon={faBell} className="text-sm" />
          </span>
        </button>

        <button
          onClick={handleSetCenter}
          title="Arahkan peta ke lokasi Anda"
          disabled={isLocating}
          className="my-3 py-2 px-5 flex items-center gap-2 border-none rounded-full bg-custom-yellow-1 text-custom-gray-1 font-semibold shadow-[inset_0_0_12px_-2px_#000] active:scale-95 transition-transform disabled:opacity-70"
        >
          <FontAwesomeIcon icon={isLocating ? faSpinner : faLocationCrosshairs} spin={isLocating} className="text-sm" />
          {isLocating ? "Mencari…" : "Lokasi Saya"}
        </button>
      </div>

      <div className="quotes text-center my-4 md:mt-12 mb-8 text-[12px] md:text-base">
        <i>Barangsiapa yang menempuh suatu jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan menuju surga. (HR. Muslim)</i>
      </div>
    </div>
  );
};

export default Home;
