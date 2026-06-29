// Records which UI the user last opened so background-push clicks can return to
// it. The service worker can't read localStorage, so the choice is stored in
// IndexedDB (readable from both the page and the worker).
//   ""      → classic UI at "/"
//   "/new"  → redesign preview at "/new/"
const DB = "kn-prefs";
const STORE = "kv";
const KEY = "uiBase";

function withStore(mode, fn) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => { db.close(); resolve(req && req.result); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    };
  });
}

// Persist the base for this app (best-effort; never throws).
export function setUiBase(base) {
  try {
    if (typeof indexedDB === "undefined") return Promise.resolve();
    return withStore("readwrite", (s) => s.put(base, KEY)).catch(() => {});
  } catch {
    return Promise.resolve();
  }
}
