import { useCallback } from "react";
import { PUSH_SUBSCRIBE, PUSH_UNSUBSCRIBE } from "../services/api";
import {
  VAPID_PUBLIC_KEY,
  isPushSupported,
  urlBase64ToUint8Array,
  registerServiceWorker,
} from "../utils/push";

/**
 * Web Push subscription lifecycle: ask permission, subscribe via the service
 * worker, and register the subscription (+ the user's location and thresholds)
 * with the backend so it can push when a nearby kajian is about to start.
 *
 * All methods no-op gracefully when push isn't supported/configured.
 */
/** Whether a subscription was created with the VAPID key we sign with now. */
export const usesCurrentKey = (sub) => {
  const raw = sub?.options?.applicationServerKey;
  // Older browsers do not expose it. Keep the subscription rather than
  // unsubscribing on a guess, which would prompt for permission again for
  // nothing. An empty value has to be checked before the comparison below,
  // which would otherwise read it as a zero-length key and call it a mismatch.
  if (!raw) return true;
  try {
    const got = new Uint8Array(raw);
    const want = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    return got.length === want.length && got.every((b, i) => b === want[i]);
  } catch {
    return true;
  }
};

export function usePushSubscription() {
  const supported = isPushSupported();

  // True if this browser currently holds an active push subscription.
  const getIsSubscribed = useCallback(async () => {
    if (!supported) return false;
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    // A subscription made against an older VAPID key can never be delivered
    // to, so reporting it as subscribed showed the toggle already on and gave
    // the user no reason to re-enable -- the one action that would have fixed
    // it. Treated as not subscribed, so the settings screen tells the truth.
    return !!sub && usesCurrentKey(sub);
  }, [supported]);

  /**
   * Subscribe (or refresh an existing subscription) and send it to the backend
   * with the given location + thresholds. Returns true on success.
   * Throws "no-location" if a location is required but missing, or "denied" if
   * the user blocks notifications.
   */

  const subscribePush = useCallback(
    async ({ lat, lng, radiusKm, leadMinutes }) => {
      if (!supported) return false;
      if (typeof lat !== "number" || typeof lng !== "number") {
        throw new Error("no-location");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("denied");

      const reg = await registerServiceWorker();
      await navigator.serviceWorker.ready;

      // Reuse an existing subscription, but only if it was created with the
      // key we still sign with. A subscription is bound to the
      // applicationServerKey it was made with, and the push service rejects a
      // mismatch with 403 forever -- so reusing one blindly left those
      // browsers permanently unable to receive anything, with re-enabling
      // notifications changing nothing.
      let sub = await reg.pushManager.getSubscription();
      if (sub && !usesCurrentKey(sub)) {
        await sub.unsubscribe();
        sub = null;
      }
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      await PUSH_SUBSCRIBE({
        subscription: sub.toJSON(),
        lat,
        lng,
        radius_km: radiusKm,
        lead_minutes: leadMinutes,
      });
      return true;
    },
    [supported]
  );

  // Unsubscribe locally and tell the backend to drop the record.
  const unsubscribePush = useCallback(async () => {
    if (!supported) return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    try {
      await PUSH_UNSUBSCRIBE(endpoint);
    } catch {
      // Backend cleanup is best-effort; dead endpoints are pruned on send too.
    }
  }, [supported]);

  return { pushSupported: supported, getIsSubscribed, subscribePush, unsubscribePush };
}

export default usePushSubscription;
