import { useEffect, useRef } from "react";
import { getKajianStatus, getMinutesUntilStart } from "../utils/kajianStatus";
import { distanceKm } from "../utils/geo";

// How often we re-scan the loaded kajian for ones that just entered the window.
const POLL_MS = 60 * 1000;

// Persisted "already notified" set, so a kajian fires at most ONCE PER DAY even
// if the app is reloaded/relaunched. Crucial on iOS, where an installed PWA
// reboots from scratch every time it's reopened — an in-memory Set would reset
// and re-fire every in-window kajian on each launch. Stored as { key: date }
// so we can prune entries for days that have already passed.
// (home/index.jsx preserves this key across its on-mount localStorage.clear().)
export const NOTIFIED_KEY = "kn_notified";

const todayStr = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

// Load the persisted notified-map, dropping entries for past dates so it can't
// grow without bound. Returns { map, sent:Set<key> }.
const loadNotified = () => {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const today = todayStr();
    const map = {};
    for (const [key, date] of Object.entries(parsed)) {
      if (typeof date === "string" && date >= today) map[key] = date; // keep today + future
    }
    return { map, sent: new Set(Object.keys(map)) };
  } catch {
    return { map: {}, sent: new Set() };
  }
};

// Stable identity for a kajian, used to notify each one at most once per day.
const kajianKey = (item) =>
  item.id || `${item.date}|${item.lat},${item.lng}|${item.time_start}|${item.topic}`;

// Deep link that opens this kajian's flyer and centers the map on its location
// when the notification is clicked (parsed on load in pages/home). Carries lat/lng
// as a fallback so it still resolves when the kajian has no stable id.
const deepLinkUrl = (item) => {
  const params = new URLSearchParams({ k: String(kajianKey(item)) });
  if (item.date) params.set("d", String(item.date));
  if (typeof item.lat === "number") params.set("lat", String(item.lat));
  if (typeof item.lng === "number") params.set("lng", String(item.lng));
  return `/?${params.toString()}`;
};

// "45 menit lagi" / "1 jam lagi" / "1 jam 20 menit lagi".
const formatLead = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m} menit lagi`;
  return m > 0 ? `${h} jam ${m} menit lagi` : `${h} jam lagi`;
};

// Show a notification without ever throwing. Android Chrome forbids the
// `new Notification()` constructor (it throws "Illegal constructor") and only
// allows the service worker's showNotification — so prefer the SW, fall back to
// the constructor on desktop, and swallow any failure so the app never crashes.
const fireNotification = async (item, mins, km) => {
  const lead = formatLead(mins);
  const title = `Kajian dekat ${lead}`;
  const where = [item.loc_name, item.city].filter(Boolean).join(", ");
  const body = [
    item.topic,
    item.speaker ? `Pemateri: ${item.speaker}` : "",
    `${where} • ${km.toFixed(1)} km`,
  ]
    .filter(Boolean)
    .join("\n");
  const url = deepLinkUrl(item);
  const options = {
    body,
    icon: "/logo_text.png",
    tag: kajianKey(item), // collapse duplicate OS notifications for the same kajian
    data: { url }, // sw.js notificationclick navigates here → opens flyer + map
  };

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    }
    const n = new Notification(title, options); // desktop fallback
    n.onclick = () => {
      window.focus();
      window.location.assign(url); // deep-link to the kajian's flyer + location
      n.close();
    };
  } catch (err) {
    // e.g. Android Chrome "Illegal constructor", or no active SW — never crash.
    console.warn("Notification failed:", err);
  }
};

/**
 * Browser-notifies the user about kajian that are starting soon and nearby,
 * while the tab is open. A kajian fires once when it is:
 *   - "upcoming" (not yet started, not finished),
 *   - starting within `leadMinutes`, and
 *   - within `radiusKm` of `userLocation`.
 *
 * No-ops unless `enabled`, a location is known, and Notification permission is
 * granted. Re-scans every minute and whenever inputs change.
 */
export function useNearbyKajianNotifications({
  enabled,
  radiusKm,
  leadMinutes,
  data,
  userLocation,
}) {
  // Kajian already notified — seeded from localStorage so the dedup survives
  // reloads/relaunches (each kajian fires at most once per day).
  const storeRef = useRef(null);
  if (storeRef.current === null) storeRef.current = loadNotified();

  // Record a kajian as notified, in memory and persisted.
  const markNotified = (key, date) => {
    const store = storeRef.current;
    store.sent.add(key);
    store.map[key] = date && date >= todayStr() ? date : todayStr();
    try {
      localStorage.setItem(NOTIFIED_KEY, JSON.stringify(store.map));
    } catch {
      // ignore storage failures (private mode, quota) — in-memory dedup still holds
    }
  };

  useEffect(() => {
    if (!enabled) return;
    if (!userLocation || !Array.isArray(data) || data.length === 0) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const sent = storeRef.current.sent;

    const check = () => {
      // Defensive: this runs synchronously inside the effect, so a throw here
      // would unmount the whole app. Never let one bad item blank the page.
      try {
        for (const item of data) {
          if (typeof item.lat !== "number" || typeof item.lng !== "number") continue;
          if (getKajianStatus(item) !== "upcoming") continue;

          const mins = getMinutesUntilStart(item);
          if (mins == null || mins <= 0 || mins > leadMinutes) continue;

          const km = distanceKm(userLocation, { lat: item.lat, lng: item.lng });
          if (km > radiusKm) continue;

          const key = kajianKey(item);
          if (sent.has(key)) continue;
          markNotified(key, item.date);
          fireNotification(item, mins, km);
        }
      } catch (err) {
        console.warn("Nearby-kajian scan failed:", err);
      }
    };

    check();
    const timer = setInterval(check, POLL_MS);
    return () => clearInterval(timer);
  }, [enabled, radiusKm, leadMinutes, data, userLocation]);
}

export default useNearbyKajianNotifications;
