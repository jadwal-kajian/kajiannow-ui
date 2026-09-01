// A stable per-browser id, so the API can tell one visitor from many.
//
// Without it /schedule falls back to hashing the client IP, and behind the
// reverse proxy that address is identical for everyone: the dashboard counted
// one unique visitor a day against hundreds of fetches.
//
// Anonymous by construction. It is a random uuid tied to nothing, sent only to
// our own API, and it never leaves localStorage.

export const VISITOR_KEY = "kn_vid";

export const getVid = () => {
  try {
    let v = localStorage.getItem(VISITOR_KEY);
    if (!v) {
      v = crypto.randomUUID
        ? crypto.randomUUID()
        : `v${Date.now()}${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(VISITOR_KEY, v);
    }
    return v;
  } catch {
    // Private mode or blocked storage: no id rather than a crash. The API
    // falls back to the IP hash, which is what it did before this existed.
    return "";
  }
};
