import { useCallback, useRef } from "react";

// Detect in-app browser webviews (Threads, Instagram, Facebook, Line, KakaoTalk, etc.).
// These embedded browsers usually have no warm location cache and rarely expose real
// GPS, so high-accuracy requests hang until they time out. We short-circuit that path.
export const isInAppBrowser = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Instagram|Threads|Barcelona|FBAN|FBAV|FB_IAB|\bLine\/|KAKAOTALK|MicroMessenger|TikTok|musical_ly|Twitter|Snapchat|WhatsApp/i.test(ua);
};

const toLatLng = (pos) => ({ lat: pos.coords.latitude, lng: pos.coords.longitude });

// Tunables (ms). Kept short for in-app browsers so the UI never feels stuck.
const FAST_TIMEOUT_INAPP = 10000;
const FAST_TIMEOUT_NORMAL = 15000;
const FAST_MAX_AGE = 5 * 60 * 1000; // a slightly stale fix beats a long hang
const HIGH_ACCURACY_GOOD = 50; // meters — good enough to stop refining
const HIGH_ACCURACY_WATCH_TIMEOUT = 20000;
const HIGH_ACCURACY_DEADLINE = 12000; // accept best fix after this

/**
 * Geolocation hook using a fast-then-refine strategy.
 *
 * 1. One quick low-accuracy `getCurrentPosition` for an immediate fix (UI never blocks on GPS).
 * 2. Optionally a high-accuracy `watchPosition` that refines the fix in the background.
 * 3. In-app browsers skip step 2 and use shorter timeouts, since their GPS rarely resolves.
 *
 * `onFix(location, { isFinal, accuracy })` may be called more than once: the first call is
 * the fast fix (dismiss any spinner then), later calls are refinements. `isFinal === true`
 * marks the position as settled (good to cache).
 */
export function useGeolocation() {
  const activeRef = useRef(null);

  const cancel = useCallback(() => {
    const active = activeRef.current;
    if (!active) return;
    if (active.watchId != null) navigator.geolocation.clearWatch(active.watchId);
    active.timers.forEach(clearTimeout);
    activeRef.current = null;
  }, []);

  const locate = useCallback(
    ({ highAccuracy = false, onFix, onError } = {}) => {
      cancel();

      if (!navigator.geolocation) {
        onError?.({ code: -1, message: "Geolocation not supported" });
        return;
      }

      const inApp = isInAppBrowser();
      // In-app webviews rarely expose real GPS — don't wait on it.
      const wantHigh = highAccuracy && !inApp;

      const state = { watchId: null, timers: [], done: false };
      activeRef.current = state;

      const finish = (location) => {
        if (state.done) return;
        state.done = true;
        cancel();
        onFix?.(location, { isFinal: true });
      };
      const fail = (error) => {
        if (state.done) return;
        state.done = true;
        cancel();
        onError?.(error);
      };

      // 1) Fast fix: low accuracy, allow a cached position.
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = toLatLng(pos);
          if (wantHigh) {
            // Show it immediately, then keep refining in the background.
            onFix?.(loc, { isFinal: false, accuracy: pos.coords.accuracy });
          } else {
            finish(loc);
          }
        },
        (error) => {
          // Only fatal if high-accuracy isn't going to run as a fallback.
          if (!wantHigh) fail(error);
        },
        {
          enableHighAccuracy: false,
          timeout: inApp ? FAST_TIMEOUT_INAPP : FAST_TIMEOUT_NORMAL,
          maximumAge: FAST_MAX_AGE,
        }
      );

      // 2) Optional refine: high-accuracy GPS, never blocks the first fix.
      if (wantHigh) {
        let best = null;
        state.watchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
            onFix?.(toLatLng(pos), { isFinal: false, accuracy: pos.coords.accuracy });
            if (pos.coords.accuracy <= HIGH_ACCURACY_GOOD) finish(toLatLng(pos));
          },
          () => {}, // ignore; the deadline below finalizes
          { enableHighAccuracy: true, timeout: HIGH_ACCURACY_WATCH_TIMEOUT, maximumAge: 0 }
        );

        // Accept the best fix we have after a bounded wait.
        state.timers.push(
          setTimeout(() => {
            if (best) finish(toLatLng(best));
            else fail({ code: 3, message: "Location request timed out" });
          }, HIGH_ACCURACY_DEADLINE)
        );
      }
    },
    [cancel]
  );

  return { locate, cancel, isInApp: isInAppBrowser() };
}

export default useGeolocation;
