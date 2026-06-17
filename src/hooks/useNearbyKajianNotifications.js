import { useEffect, useRef } from "react";
import { getKajianStatus, getMinutesUntilStart } from "../utils/kajianStatus";
import { distanceKm } from "../utils/geo";

// How often we re-scan the loaded kajian for ones that just entered the window.
const POLL_MS = 60 * 1000;

// Stable identity for a kajian, used to notify each one at most once per session.
const kajianKey = (item) =>
  item.id || `${item.date}|${item.lat},${item.lng}|${item.time_start}|${item.topic}`;

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
  const options = {
    body,
    icon: "/logo_text.png",
    tag: kajianKey(item), // collapse duplicate OS notifications for the same kajian
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
  // Kajian already notified this session — avoids repeat pings on each poll.
  const sentRef = useRef(new Set());

  useEffect(() => {
    if (!enabled) return;
    if (!userLocation || !Array.isArray(data) || data.length === 0) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const sent = sentRef.current;

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
          sent.add(key);
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
