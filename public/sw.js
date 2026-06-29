/* Service worker for Web Push — receives pushes and shows notifications even
 * when the site is not open. Served at the site root so its scope covers "/".
 *
 * The backend sends a JSON payload: { title, body, tag, url }.
 */

self.addEventListener("install", () => {
  // Activate this worker immediately instead of waiting for old tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Kajian dekat";
  const options = {
    body: data.body || "",
    icon: "/logo_text.png",
    badge: "/logo_text.png",
    tag: data.tag, // collapse duplicate notifications for the same kajian
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Normalize a deep-link URL to root-based (strip any "/new" UI prefix) so it can
// be re-prefixed with the chosen UI base without doubling up.
function stripUiBase(url) {
  if (url === "/new" || url === "/new/") return "/";
  if (url.startsWith("/new/")) return url.slice(4); // "/new/?k=" -> "/?k="
  return url;
}

// Prefix a root-based URL with a UI base ("" classic, "/new" redesign).
function withUiBase(url, base) {
  const root = stripUiBase(url);
  return base ? base + root : root;
}

// The UI base of an already-open tab, from its URL.
function clientUiBase(client) {
  try {
    return new URL(client.url).pathname.startsWith("/new") ? "/new" : "";
  } catch {
    return "";
  }
}

// The user's last-opened UI base, persisted by the page in IndexedDB. Used only
// for a cold click (no tab open), since a worker can't read localStorage.
// Defaults to "" (classic).
function readUiBase() {
  return new Promise((resolve) => {
    try {
      const open = indexedDB.open("kn-prefs", 1);
      open.onupgradeneeded = () => open.result.createObjectStore("kv");
      open.onerror = () => resolve("");
      open.onsuccess = () => {
        const db = open.result;
        try {
          const req = db.transaction("kv", "readonly").objectStore("kv").get("uiBase");
          req.onsuccess = () => {
            resolve(typeof req.result === "string" ? req.result : "");
            db.close();
          };
          req.onerror = () => {
            resolve("");
            db.close();
          };
        } catch {
          resolve("");
        }
      };
    } catch {
      resolve("");
    }
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Deep link is stored root-based ("/?k=...") or may already carry "/new"; both
  // are normalized, then routed to the user's preferred UI.
  const raw = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // A tab is open → keep the user in the UI they're already using.
      for (const client of allClients) {
        if ("focus" in client) {
          client.navigate(withUiBase(raw, clientUiBase(client))).catch(() => {});
          return client.focus();
        }
      }
      // Cold click (no tab) → open the user's last-preferred UI.
      const base = await readUiBase();
      if (self.clients.openWindow) return self.clients.openWindow(withUiBase(raw, base));
    })()
  );
});
