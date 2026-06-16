// Local memory of which kajian this user has reacted to. The backend counters
// are anonymous (no accounts), so the client tracks its own reactions to allow
// un-reacting and to avoid double-counting on re-tap.
//
// Shape in localStorage: { like: [id, ...], going: [id, ...] }.
// The key is preserved across Home's on-mount localStorage.clear().

export const REACTIONS_KEY = "kn_reactions";

const read = () => {
  try {
    const raw = localStorage.getItem(REACTIONS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return { like: data.like || [], going: data.going || [] };
  } catch {
    return { like: [], going: [] };
  }
};

const write = (data) => {
  try {
    localStorage.setItem(REACTIONS_KEY, JSON.stringify(data));
  } catch {
    // ignore storage failures (private mode, quota)
  }
};

// Has this user reacted to `id` with `type` ("like" | "going")?
export const hasReacted = (id, type) => read()[type].includes(id);

// Record (or clear) this user's reaction to `id` for `type`.
export const setReacted = (id, type, on) => {
  const data = read();
  const set = new Set(data[type]);
  if (on) set.add(id);
  else set.delete(id);
  data[type] = [...set];
  write(data);
};
