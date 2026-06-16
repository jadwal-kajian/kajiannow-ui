// Helpers for Web Push subscriptions (background notifications via a service worker).

export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

// Background push needs a service worker, the Push API, the Notification API,
// AND a configured VAPID public key. Missing any → feature unavailable.
export const isPushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window &&
  !!VAPID_PUBLIC_KEY;

// VAPID keys are URL-safe base64; the Push API wants a Uint8Array.
export const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
};

// Register (or reuse) the root-scoped service worker.
export const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js");
};
