import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye, faEyeSlash, faBell, faSpinner, faLocationCrosshairs, faMagnifyingGlass,
  faSliders, faPlus, faLocationDot, faMosque, faCircleInfo, faClock,
} from "@fortawesome/free-solid-svg-icons";
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
import { THEME_KEY, ThemeToggle } from "../../theme";
import { getKajianStatus, formatTimeRange } from "../../utils/kajianStatus";
import { distanceKm } from "../../utils/geo";

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

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Status → pill label + token classes (shared by the peek card and carousel).
const STATUS_PILL = {
  ongoing: { label: "Berlangsung", cls: "bg-ok-bg text-ok", dot: "bg-ok" },
  upcoming: { label: "Akan datang", cls: "bg-soon-bg text-soon", dot: "bg-soon" },
  passed: { label: "Selesai", cls: "bg-done-bg text-done", dot: "bg-done" },
};

function StatusPill({ status, size = "sm" }) {
  const meta = status && STATUS_PILL[status];
  if (!meta) return null;
  const pad = size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold ${pad} ${meta.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

StatusPill.propTypes = { status: PropTypes.string, size: PropTypes.string };

// Square poster thumbnail; falls back to a striped placeholder with the first tag.
function PosterThumb({ info, className = "" }) {
  const cat = String(info.tags || "").split(",")[0]?.trim();
  if (info.src_image) {
    return <img src={`${BASE_URL}/${info.src_image}`} alt="" className={`object-cover ${className}`} />;
  }
  return (
    <div
      className={`flex items-end p-1.5 ${className}`}
      style={{
        background:
          "repeating-linear-gradient(135deg, var(--kn-surface-2) 0 10px, var(--kn-amber-soft) 10px 20px)",
      }}
    >
      {cat && (
        <span className="rounded bg-surface/80 px-1.5 py-0.5 text-[9px] font-semibold text-ink-dim">{cat}</span>
      )}
    </div>
  );
}

PosterThumb.propTypes = { info: PropTypes.object.isRequired, className: PropTypes.string };

// Floating round-square control button used in the home map chrome.
function IconButton({ icon, onClick, label, active = false, dot = false, spin = false, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`relative w-11 h-11 flex items-center justify-center rounded-2xl border shadow-[0_8px_18px_-10px_rgba(60,40,10,.45)] active:scale-90 transition-transform disabled:opacity-70 ${
        active ? "bg-accent text-accent-ink border-accent" : "bg-surface text-ink border-line"
      }`}
    >
      <FontAwesomeIcon icon={icon} spin={spin} />
      {dot && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-ok border-2 border-surface" />}
    </button>
  );
}

IconButton.propTypes = {
  icon: PropTypes.object.isRequired,
  onClick: PropTypes.func,
  label: PropTypes.string,
  active: PropTypes.bool,
  dot: PropTypes.bool,
  spin: PropTypes.bool,
  disabled: PropTypes.bool,
};

const Home = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState();
  const [showAllInfo, setShowAllInfo] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  // Home layout: "a" = floating controls (default), "b" = app-bar + carousel.
  const [homeVariant, setHomeVariant] = useState("a");
  // Variant-B quick status chip: "all" | "ongoing" | "upcoming".
  const [quickStatus, setQuickStatus] = useState("all");
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
    const keep = [NOTIFY_KEY, REACTIONS_KEY, THEME_KEY].map((k) => [k, localStorage.getItem(k)]);
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

  // Markers/cards reflect the variant-B quick status chip (all/ongoing/upcoming).
  const mapData = useMemo(() => {
    if (quickStatus === "all") return filteredData;
    return filteredData.filter((it) => getKajianStatus(it) === quickStatus);
  }, [filteredData, quickStatus]);

  // Nearest-first ordering for the peek card + carousel.
  const sortedByDistance = useMemo(() => {
    if (!userLocation) return mapData;
    return [...mapData].sort((a, b) => distanceKm(userLocation, a) - distanceKm(userLocation, b));
  }, [mapData, userLocation]);
  const nearest = sortedByDistance[0] || null;
  const carousel = sortedByDistance.slice(0, 12);
  const locCount = useMemo(() => new Set(mapData.map((d) => `${d.lat},${d.lng}`)).size, [mapData]);
  const cityLabel = selectedCity || data[0]?.city || "Indonesia";

  const openKajian = useCallback(
    (item) => ShowPopupInfo({ location: item, group: groupTopicsByLocation(item.lat, item.lng, data) }),
    [data]
  );

  const QUICK = [
    { key: "all", label: "Semua" },
    { key: "ongoing", label: "Berlangsung" },
    { key: "upcoming", label: "Akan datang" },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden bg-bg text-ink">
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

      {/* Full-bleed map hero */}
      <div className="absolute inset-0">
        {mapCenter ? (
          <KajianMap
            locations={mapData}
            ref={mapRef}
            showAllInfo={showAllInfo}
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={zoom}
            userLocation={userLocation ? [userLocation.lat, userLocation.lng] : null}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink-dim">
            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Memuat peta…
          </div>
        )}
      </div>

      {/* ===================== VARIANT A — floating controls ===================== */}
      {homeVariant === "a" && (
        <>
          <div className="absolute top-3 left-3 right-[60px] z-[1000]">
            <button
              onClick={showFilter}
              aria-label="Saring kajian dan pilih tanggal"
              className="w-full flex items-center gap-2.5 bg-surface border border-line rounded-2xl px-3.5 py-3 shadow-[0_10px_24px_-12px_rgba(60,40,10,.5)] text-left active:scale-[.99] transition-transform"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-accent" />
              <span className="flex-1 truncate text-ink-dim text-sm">{showDate || "Cari kajian, topik, masjid…"}</span>
              <FontAwesomeIcon icon={faSliders} className={hasActiveFilters ? "text-accent" : "text-ink"} />
            </button>
          </div>

          <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
            <IconButton icon={faBell} onClick={showNotifySettings} label="Notifikasi" dot={notifySettings.enabled} />
            <IconButton
              icon={showAllInfo ? faEyeSlash : faEye}
              onClick={() => setShowAllInfo(!showAllInfo)}
              label={showAllInfo ? "Sembunyikan info" : "Tampilkan info"}
              active={showAllInfo}
            />
            <IconButton icon={faCircleInfo} onClick={() => navigate("/about")} label="Tentang" />
            <ThemeToggle />
          </div>

          {/* Lapor pill + locate FAB */}
          <button
            onClick={showReport}
            className="absolute left-3 bottom-[150px] z-[1000] h-12 px-4 flex items-center gap-2 rounded-2xl bg-surface border border-line text-ink font-bold text-sm shadow-[0_10px_24px_-12px_rgba(60,40,10,.5)] active:scale-95 transition-transform"
          >
            <FontAwesomeIcon icon={faPlus} className="text-accent" /> Lapor
          </button>
          <button
            onClick={handleSetCenter}
            disabled={isLocating}
            aria-label="Arahkan peta ke lokasi Anda"
            className="absolute right-3 bottom-[150px] z-[1000] w-12 h-12 flex items-center justify-center rounded-2xl bg-accent text-accent-ink shadow-[0_12px_26px_-10px_rgba(13,107,110,.6)] active:scale-95 transition-transform disabled:opacity-70"
          >
            <FontAwesomeIcon icon={isLocating ? faSpinner : faLocationCrosshairs} spin={isLocating} />
          </button>

          {/* Nearest peek card */}
          {nearest && (
            <div className="absolute left-3 right-3 bottom-3 z-[1000]">
              <div className="mb-1.5 ml-1.5 text-[11px] font-extrabold tracking-wide uppercase text-ink-dim drop-shadow-[0_1px_2px_rgba(0,0,0,.25)]">
                Kajian terdekat
              </div>
              <button
                onClick={() => openKajian(nearest)}
                className="w-full flex gap-3 items-stretch bg-surface border border-line rounded-2xl p-2.5 shadow-[0_16px_34px_-16px_rgba(60,40,10,.55)] text-left active:scale-[.99] transition-transform"
              >
                <PosterThumb info={nearest} className="w-14 h-14 flex-none rounded-xl" />
                <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center">
                  <StatusPill status={getKajianStatus(nearest)} size="xs" />
                  <div className="truncate text-sm font-bold text-ink">{nearest.topic}</div>
                  <div className="flex items-center gap-1.5 text-[12px] text-ink-dim">
                    <FontAwesomeIcon icon={faClock} className="text-[11px]" />
                    <span className="truncate">{formatTimeRange(nearest, { endFallback: "Selesai" })}</span>
                  </div>
                </div>
              </button>
            </div>
          )}
        </>
      )}

      {/* ===================== VARIANT B — app-bar + carousel ===================== */}
      {homeVariant === "b" && (
        <>
          <div className="absolute top-0 left-0 right-0 z-[1000] bg-surface border-b border-line shadow-[0_8px_24px_-16px_rgba(60,40,10,.5)] px-4 pt-3 pb-3">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-accent text-accent-ink flex items-center justify-center">
                    <FontAwesomeIcon icon={faMosque} className="text-[12px]" />
                  </span>
                  <span className="text-lg font-extrabold">KajianNow</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[12px] font-semibold text-ink-dim">
                  <FontAwesomeIcon icon={faLocationDot} className="text-accent" /> {cityLabel} · {locCount} lokasi
                </div>
              </div>
              <div className="flex gap-2">
                <IconButton icon={faBell} onClick={showNotifySettings} label="Notifikasi" dot={notifySettings.enabled} />
                <ThemeToggle />
              </div>
            </div>
            <button
              onClick={showFilter}
              className="w-full flex items-center gap-2.5 bg-surface-2 border border-line rounded-xl px-3 py-2.5 text-left"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-accent" />
              <span className="flex-1 truncate text-ink-dim text-[13px]">{showDate || "Cari kajian, topik, masjid…"}</span>
            </button>
            <div className="flex gap-2 overflow-x-auto mt-2.5 pb-0.5 kn-noscroll">
              {QUICK.map((c) => {
                const on = quickStatus === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setQuickStatus(c.key)}
                    className={`flex-none px-3 py-1.5 rounded-full text-[12px] font-bold border transition-colors ${
                      on ? "bg-accent text-accent-ink border-accent" : "bg-surface-2 text-ink border-line"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSetCenter}
            disabled={isLocating}
            aria-label="Arahkan peta ke lokasi Anda"
            className="absolute right-3 bottom-[170px] z-[1000] w-12 h-12 flex items-center justify-center rounded-2xl bg-accent text-accent-ink shadow-[0_12px_26px_-10px_rgba(13,107,110,.6)] active:scale-95 transition-transform disabled:opacity-70"
          >
            <FontAwesomeIcon icon={isLocating ? faSpinner : faLocationCrosshairs} spin={isLocating} />
          </button>

          {/* Bottom carousel */}
          {carousel.length > 0 && (
            <div className="absolute left-0 right-0 bottom-3 z-[1000] flex gap-3 overflow-x-auto px-3 pb-1 kn-noscroll">
              {carousel.map((item, i) => (
                <button
                  key={item.id ?? i}
                  onClick={() => openKajian(item)}
                  className="flex-none w-[230px] flex gap-2.5 bg-surface border border-line rounded-2xl p-2.5 shadow-[0_14px_30px_-16px_rgba(60,40,10,.55)] text-left active:scale-[.99] transition-transform"
                >
                  <PosterThumb info={item} className="w-14 h-14 flex-none rounded-xl" />
                  <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center">
                    <StatusPill status={getKajianStatus(item)} size="xs" />
                    <div className="truncate text-[13px] font-bold text-ink">{item.topic}</div>
                    <div className="truncate text-[11px] text-ink-dim">{item.loc_name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* A/B layout switch (dev/preview) */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[150px] z-[1000] flex items-center rounded-full bg-surface border border-line p-0.5 text-[11px] font-bold shadow-[0_8px_18px_-10px_rgba(60,40,10,.45)]">
        {["a", "b"].map((v) => (
          <button
            key={v}
            onClick={() => setHomeVariant(v)}
            aria-label={`Tata letak ${v.toUpperCase()}`}
            className={`px-3 py-1 rounded-full uppercase transition-colors ${
              homeVariant === v ? "bg-accent text-accent-ink" : "text-ink-dim"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {!loading && mapCenter && mapData.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[900] flex items-center justify-center p-4">
          <div className="pointer-events-auto max-w-[300px] rounded-2xl bg-surface border border-line px-5 py-4 text-center shadow-[0_16px_34px_-16px_rgba(60,40,10,.55)]">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-2xl text-accent" />
            <p className="mt-2 font-bold text-ink">
              {hasActiveFilters || quickStatus !== "all" ? "Tidak ada kajian yang cocok" : "Belum ada kajian pada tanggal ini"}
            </p>
            <p className="mt-1 text-[12px] text-ink-dim">
              {hasActiveFilters || quickStatus !== "all"
                ? "Coba ubah atau hapus filter Anda."
                : "Coba pilih tanggal lain atau periksa kembali nanti."}
            </p>
            {(hasActiveFilters || quickStatus !== "all") && (
              <button
                onClick={() => {
                  clearFilters();
                  setQuickStatus("all");
                }}
                className="mt-3 rounded-full bg-accent px-4 py-1.5 text-[12px] font-bold text-accent-ink active:scale-95 transition-transform"
              >
                Hapus filter
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
