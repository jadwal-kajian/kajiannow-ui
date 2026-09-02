import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye, faEyeSlash, faBell, faSpinner, faLocationCrosshairs, faMagnifyingGlass,
  faSliders, faPlus, faCircleInfo, faClock, faChevronLeft, faChevronRight, faLocationDot, faCalendar, faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { GET_ALL_KAJIAN } from "../../services/api";
import SwalPopup from "../../components/swalPopup/index";
import { convertToYYYYMMDD, ID_FormattedDate, groupTopicsByLocation } from "../../utils/helpers";
import KajianMap from "../../components/kajianMap";
import { ShowPopupInfo } from "../../components/kajianMap/ShowPopupInfo";
import LocationErrorPopup from "../../components/swalPopup/contents/locationError";
import LocationLoadingPopup from "../../components/swalPopup/contents/locationLoading";
import LaporPopup from "../../components/swalPopup/contents/lapor";
import NotifySettingsPopup from "../../components/swalPopup/contents/notifySettings";
import { useGeolocation, isInAppBrowser } from "../../hooks/useGeolocation";
import { useNearbyKajianNotifications, NOTIFIED_KEY } from "../../hooks/useNearbyKajianNotifications";
import { usePushSubscription } from "../../hooks/usePushSubscription";
import { REACTIONS_KEY } from "../../utils/reactions";
import { VISITOR_KEY } from "../../utils/visitor";

// Set once the visitor has been told the bell can notify them, so the hint is
// shown once rather than on every visit. On the keep-list below for that reason.
const PUSH_HINT_KEY = "kn_push_hint_seen";
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

// Human distance: "850 m" under 1 km, else "1.2 km". Null when unknown.
const fmtDist = (km) => {
  if (km == null || !isFinite(km)) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
};

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
    <span className={`self-start inline-flex items-center gap-1.5 rounded-full font-bold ${pad} ${meta.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

StatusPill.propTypes = { status: PropTypes.string, size: PropTypes.string };

// Square poster thumbnail. Nothing renders when there's no poster — the card's
// text just fills the width (cleaner than an empty placeholder).
function PosterThumb({ info, className = "" }) {
  if (!info.src_image) return null;
  return <img src={`${BASE_URL}/${info.src_image}`} alt="" className={`object-cover ${className}`} />;
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

  // Google-Maps-style draggable bottom sheet for "Kajian terdekat": a small peek
  // by default; drag the handle up to expand, then the list scrolls. Snaps to the
  // nearer of peek/expanded on release; a tap toggles between them.
  const SHEET_PEEK = 150;
  const sheetMaxH = () =>
    Math.round((typeof window !== "undefined" ? window.innerHeight : 800) * 0.7);
  const [sheetH, setSheetH] = useState(SHEET_PEEK);
  const [sheetDragging, setSheetDragging] = useState(false);
  const sheetDragRef = useRef(null);

  const onSheetDown = (e) => {
    sheetDragRef.current = { startY: e.clientY, startH: sheetH, moved: 0 };
    setSheetDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* unsupported */ }
  };
  const onSheetMove = (e) => {
    const d = sheetDragRef.current;
    if (!d) return;
    const dy = d.startY - e.clientY; // up = grow
    d.moved = Math.max(d.moved, Math.abs(dy));
    setSheetH(Math.min(sheetMaxH(), Math.max(SHEET_PEEK, d.startH + dy)));
  };
  const onSheetUp = () => {
    const d = sheetDragRef.current;
    if (!d) return;
    sheetDragRef.current = null;
    setSheetDragging(false);
    const max = sheetMaxH();
    if (d.moved < 6) {
      // Treat as a tap → toggle.
      setSheetH((h) => (h > SHEET_PEEK + 4 ? SHEET_PEEK : max));
    } else {
      // Drag → snap to nearer stop.
      setSheetH((h) => (h > (SHEET_PEEK + max) / 2 ? max : SHEET_PEEK));
    }
  };
  const mapRef = useRef(null);
  const locatingRef = useRef(false); // synchronous guard against overlapping requests
  const { locate } = useGeolocation();
  const [notifySettings, setNotifySettings] = useState(readNotifySettings);
  const push = usePushSubscription();

  // Offered only to someone who could receive notifications and is not already
  // receiving them. getIsSubscribed is key-aware, so a browser holding a
  // subscription we can no longer deliver to counts as not subscribed and is
  // told -- the one nudge that gets it working again.
  const [showPushHint, setShowPushHint] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let observer;
    // A sweetalert backdrop covers the page at z-index 1060, and one is up on
    // load asking about location. Revealing the hint under it would leave
    // something visible at the edges and impossible to click.
    const modalOpen = () => document.body.classList.contains("swal2-shown");
    const reveal = () => {
      if (cancelled || modalOpen()) return;
      setShowPushHint(true);
      observer?.disconnect();
    };
    (async () => {
      try {
        if (!push.pushSupported) return;
        if (localStorage.getItem(PUSH_HINT_KEY)) return;
        if (await push.getIsSubscribed()) return;
        if (cancelled) return;
        reveal();
        if (!cancelled && modalOpen()) {
          observer = new MutationObserver(reveal);
          observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
        }
      } catch {
        // Storage blocked or the check threw: say nothing rather than nag.
      }
    })();
    return () => { cancelled = true; observer?.disconnect(); };
  }, [push]);

  const dismissPushHint = useCallback(() => {
    setShowPushHint(false);
    try { localStorage.setItem(PUSH_HINT_KEY, "1"); } catch { /* nothing to remember it with */ }
  }, []);

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

  useEffect(() => {
    // Clear stale caches but keep settings that must survive reloads.
    const keep = [NOTIFY_KEY, REACTIONS_KEY, THEME_KEY, NOTIFIED_KEY, VISITOR_KEY, PUSH_HINT_KEY].map((k) => [k, localStorage.getItem(k)]);
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
    // A notification targets ONE kajian — open its flyer directly (group:[item]),
    // not the multi-session location sheet for a shared venue.
    ShowPopupInfo({ location: item, group: [item] });
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
      const itemTags = String(item.tags || "").split(",").map((tag) => tag.trim());
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
    // Route through clearFilters so the PERSISTED filter is wiped too — otherwise
    // an untouched city dropdown silently resurrects the old city on next apply.
    clearFilters();
  };

  // Step the selected date by whole days (quick prev/next-day nav).
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

  const mapData = filteredData;

  // Stable array identities for the memoized KajianMap. Inline [lat, lng]
  // literals would be new on every render, re-rendering the whole marker tree
  // and re-firing the map's flyTo effect each time an overlay (bottom sheet,
  // spinner, …) updates — flying the map back mid-pan and janking the drag.
  const mapCenterArr = useMemo(
    () => (mapCenter ? [mapCenter.lat, mapCenter.lng] : null),
    [mapCenter]
  );
  const userLocationArr = useMemo(
    () => (userLocation ? [userLocation.lat, userLocation.lng] : null),
    [userLocation]
  );

  // Precompute status + distance ONCE per item (O(n)) so the sort comparator and
  // the card render do O(1) lookups instead of recomputing moments/PrayerTimes
  // (status) and great-circle math (distance) on every comparison.
  const statusByItem = useMemo(() => {
    const m = new Map();
    for (const it of mapData) m.set(it, getKajianStatus(it));
    return m;
  }, [mapData]);
  const distByItem = useMemo(() => {
    const m = new Map();
    if (userLocation) for (const it of mapData) m.set(it, distanceKm(userLocation, it));
    return m;
  }, [mapData, userLocation]);

  // "Kajian terdekat" ordering: nearest first (by distance to the user), but
  // finished (Selesai) kajian always sink below the still-relevant ones.
  const sortedForDisplay = useMemo(() => {
    const finished = (it) => (statusByItem.get(it) === "passed" ? 1 : 0);
    return [...mapData].sort((a, b) => {
      const fa = finished(a);
      const fb = finished(b);
      if (fa !== fb) return fa - fb;
      if (!userLocation) return 0;
      return (distByItem.get(a) ?? Infinity) - (distByItem.get(b) ?? Infinity);
    });
  }, [mapData, userLocation, statusByItem, distByItem]);
  const carousel = sortedForDisplay.slice(0, 12);

  const openKajian = useCallback(
    (item) => ShowPopupInfo({ location: item, group: groupTopicsByLocation(item.lat, item.lng, data) }),
    [data]
  );

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
            center={mapCenterArr}
            zoom={zoom}
            userLocation={userLocationArr}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink-dim">
            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Memuat peta…
          </div>
        )}
      </div>

      {/* Floating map controls */}
      {(
        <>
          <div className="absolute top-[calc(env(safe-area-inset-top)+0.75rem)] left-3 right-[60px] max-w-[520px] z-[1000] flex items-center gap-1.5">
            <button
              onClick={() => changeDay(-1)}
              aria-label="Hari sebelumnya"
              className="flex-none w-10 h-12 flex items-center justify-center rounded-2xl bg-surface border border-line text-ink shadow-[0_10px_24px_-12px_rgba(60,40,10,.5)] active:scale-90 transition-transform"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button
              onClick={showFilter}
              aria-label="Saring kajian dan pilih tanggal"
              className="flex-1 min-w-0 flex items-center gap-2 h-12 bg-surface border border-line rounded-2xl px-3 shadow-[0_10px_24px_-12px_rgba(60,40,10,.5)] text-left active:scale-[.99] transition-transform"
            >
              <FontAwesomeIcon icon={faCalendar} className="text-accent shrink-0" />
              <span className="flex-1 truncate text-sm font-semibold text-ink">{showDate || "Pilih tanggal"}</span>
              <FontAwesomeIcon icon={faSliders} className={`shrink-0 ${hasActiveFilters ? "text-accent" : "text-ink-dim"}`} />
            </button>
            <button
              onClick={() => changeDay(1)}
              aria-label="Hari berikutnya"
              className="flex-none w-10 h-12 flex items-center justify-center rounded-2xl bg-surface border border-line text-ink shadow-[0_10px_24px_-12px_rgba(60,40,10,.5)] active:scale-90 transition-transform"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>

          <div className="absolute top-[calc(env(safe-area-inset-top)+0.75rem)] right-3 z-[1000] flex flex-col gap-2">
            {/* Wrapper so the hint is a sibling of the button rather than inside
                it. The column is pinned to the right edge, so the bubble opens
                leftwards -- above would run into the safe-area inset. */}
            <div className="relative">
              {showPushHint && (
                <div
                  role="status"
                  style={{ animation: "kn-hint-in 420ms cubic-bezier(.22,1.4,.36,1) both" }}
                  className="absolute right-full top-1/2 z-10 mr-2 flex w-max max-w-[min(60vw,13rem)] items-start gap-2 rounded-2xl border border-line bg-surface px-3 py-2 text-[13px] leading-snug text-ink shadow-[0_8px_18px_-10px_rgba(60,40,10,.45)]"
                >
                  <button type="button" onClick={() => { dismissPushHint(); showNotifySettings(); }} className="text-left">
                    Dapatkan pemberitahuan kajian terdekat
                  </button>
                  <button
                    type="button"
                    onClick={dismissPushHint}
                    aria-label="Tutup info notifikasi"
                    className="-mr-1 shrink-0 leading-none text-ink-dim hover:text-ink"
                  >
                    &times;
                  </button>
                </div>
              )}
              <IconButton
                icon={faBell}
                onClick={() => { dismissPushHint(); showNotifySettings(); }}
                label="Pengaturan notifikasi kajian terdekat"
                dot={notifySettings.enabled}
              />
            </div>
            <IconButton
              icon={showAllInfo ? faEyeSlash : faEye}
              onClick={() => setShowAllInfo(!showAllInfo)}
              label={showAllInfo ? "Sembunyikan info" : "Tampilkan info"}
              active={showAllInfo}
            />
            <IconButton icon={faCircleInfo} onClick={() => navigate("/about")} label="Tentang" />
            <ThemeToggle />
            {/* Leave the preview: full page load back to the classic UI at "/". */}
            <IconButton
              icon={faArrowLeft}
              onClick={() => window.location.assign("/")}
              label="Kembali ke tampilan lama"
            />
          </div>

          {/* Bottom overlay: Lapor + locate controls riding directly above a
              vertical, scrollable "Kajian terdekat" sheet. pointer-events is
              gated so the map stays draggable through the gaps, and the controls
              sit above the sheet for any list length (no overlap). */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] flex flex-col pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
            <div className="flex items-center justify-between gap-2 px-3 pb-2">
              <button
                onClick={showReport}
                className="pointer-events-auto h-12 px-4 flex items-center gap-2 rounded-2xl bg-surface border border-line text-ink font-bold text-sm shadow-[0_10px_24px_-12px_rgba(60,40,10,.5)] active:scale-95 transition-transform"
              >
                <FontAwesomeIcon icon={faPlus} className="text-accent" /> Lapor
              </button>
              <button
                onClick={handleSetCenter}
                disabled={isLocating}
                aria-label="Lokasi Saya"
                className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-2xl bg-accent text-accent-ink shadow-[0_12px_26px_-10px_rgba(13,107,110,.6)] active:scale-95 transition-transform disabled:opacity-70"
              >
                <FontAwesomeIcon icon={isLocating ? faSpinner : faLocationCrosshairs} spin={isLocating} />
              </button>
            </div>

            {/* Nearby kajian — vertical scroll list, status-first
                (ongoing/upcoming before finished), then nearest. */}
            {carousel.length > 0 && (
              <div
                className={`pointer-events-auto mx-2 flex flex-col overflow-hidden rounded-2xl bg-surface border border-line shadow-[0_16px_34px_-16px_rgba(60,40,10,.55)] ${sheetDragging ? "" : "transition-[height] duration-200 ease-out"}`}
                style={{ height: sheetH }}
              >
                {/* Drag handle + header — drag to resize, tap to toggle. touch-none
                    so the gesture resizes the sheet instead of scrolling the page. */}
                <div
                  onPointerDown={onSheetDown}
                  onPointerMove={onSheetMove}
                  onPointerUp={onSheetUp}
                  onPointerCancel={onSheetUp}
                  className="flex-none cursor-grab touch-none select-none active:cursor-grabbing"
                >
                  <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line" />
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-[11px] font-extrabold tracking-wide uppercase text-ink">Kajian terdekat</span>
                    <span className="text-[11px] font-bold text-ink-dim">{carousel.length}</span>
                  </div>
                </div>
                <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto px-2 pb-2 kn-noscroll">
                  {carousel.map((item, i) => {
                    const dist = fmtDist(distByItem.get(item));
                    return (
                      <button
                        key={item.id ?? i}
                        onClick={() => openKajian(item)}
                        className="w-full flex gap-3 items-stretch bg-surface border border-line rounded-2xl p-2.5 text-left active:scale-[.99] transition-transform"
                      >
                        <PosterThumb info={item} className="w-14 h-14 flex-none rounded-xl" />
                        <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center">
                          <div className="flex items-center gap-2">
                            <StatusPill status={statusByItem.get(item)} size="xs" />
                            {dist && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accent shrink-0">
                                <FontAwesomeIcon icon={faLocationDot} className="text-[10px]" />
                                {dist}
                              </span>
                            )}
                          </div>
                          <div className="truncate text-sm font-bold text-ink">{item.topic}</div>
                          <div className="flex items-center gap-1.5 text-[12px] text-ink-dim">
                            <FontAwesomeIcon icon={faClock} className="text-[11px]" />
                            <span className="truncate">{formatTimeRange(item, { endFallback: "selesai" })}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && mapCenter && mapData.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[900] flex items-center justify-center p-4">
          <div className="pointer-events-auto max-w-[300px] rounded-2xl bg-surface border border-line px-5 py-4 text-center shadow-[0_16px_34px_-16px_rgba(60,40,10,.55)]">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-2xl text-accent" />
            <p className="mt-2 font-bold text-ink">
              {hasActiveFilters ? "Tidak ada kajian yang cocok" : "Belum ada kajian pada tanggal ini"}
            </p>
            <p className="mt-1 text-[12px] text-ink-dim">
              {hasActiveFilters
                ? "Coba ubah atau hapus filter Anda."
                : "Coba pilih tanggal lain atau periksa kembali nanti."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
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
