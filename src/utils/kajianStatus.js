import moment from "moment-timezone";
import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";
import { timeStartMapping } from "./helpers";

// Kajian schedules are in Western Indonesia time (Jawa Barat = WIB).
const TZ = "Asia/Jakarta";

// Assumed length when an event has no explicit end time.
const DEFAULT_DURATION_MIN = 90;

// Minutes after the adhan that a "ba'da <prayer>" kajian is treated as starting.
const BADA_OFFSET_MIN = 0;

// Indonesia's Kemenag parameters ≈ adhan's Singapore method (Fajr 20°, Isha 18°).
const calcParams = CalculationMethod.Singapore();

// Map a "ba'da <prayer>" start to an adhan prayer by keyword, tolerating the many
// Indonesian spellings (zuhur/zhuhur/dzuhur/dhuhur/luhur, ashar/asar, isya/isha…).
const PRAYER_KEYWORDS = [
  { prayer: "fajr", words: ["subuh", "shubuh", "fajar", "fajr"] },
  { prayer: "dhuhr", words: ["dzuhur", "dhuhur", "zhuhur", "zuhur", "dzuhr", "zuhr", "dhuhr", "luhur", "lohor", "dohor"] },
  { prayer: "asr", words: ["ashar", "asar", "ashr", "asr"] },
  { prayer: "maghrib", words: ["maghrib", "magrib"] },
  { prayer: "isha", words: ["isya", "isyak", "isha", "isa"] },
];

// Human labels and rough WIB fallback times keyed by adhan prayer.
const PRAYER_LABEL = {
  fajr: "Ba'da Subuh",
  dhuhr: "Ba'da Dzuhur",
  asr: "Ba'da Ashar",
  maghrib: "Ba'da Maghrib",
  isha: "Ba'da Isya'",
};
const PRAYER_APPROX = { fajr: "05:00", dhuhr: "12:30", asr: "15:30", maghrib: "18:30", isha: "19:30" };

// Returns the adhan prayer name for a prayer-relative start ("ba'da …"), or null.
const prayerOf = (raw) => {
  const key = String(raw || "").toLowerCase().trim();
  if (!/ba'?da|bakda|ba'?do/.test(key)) return null; // not prayer-relative
  for (const { prayer, words } of PRAYER_KEYWORDS) {
    if (words.some((w) => key.includes(w))) return prayer;
  }
  return null;
};

const clockMoment = (date, hhmm) =>
  moment.tz(`${date} ${hhmm}`, "YYYY-MM-DD HH:mm", TZ);

// Parse "09.00" / "9:00" -> "HH:mm", or null.
const parseClock = (raw) => {
  if (!raw) return null;
  const m = String(raw).toLowerCase().trim().match(/^(\d{1,2})[.:](\d{2})$/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : null;
};

// Real prayer time for this kajian's location/date, or null if not computable.
const prayerMoment = (item, prayerName) => {
  const [y, m, d] = String(item.date).split("-").map(Number);
  if (!y || !m || !d) return null;
  if (typeof item.lat !== "number" || typeof item.lng !== "number") return null;

  const times = new PrayerTimes(
    new Coordinates(item.lat, item.lng),
    new Date(y, m - 1, d),
    calcParams
  );
  const t = times[prayerName];
  return t ? moment(t).add(BADA_OFFSET_MIN, "minutes") : null;
};

const startMoment = (item) => {
  const raw = item.time_start;
  if (!raw) return null;

  const prayer = prayerOf(raw);
  if (prayer) {
    return prayerMoment(item, prayer) || clockMoment(item.date, PRAYER_APPROX[prayer]);
  }

  const hhmm = parseClock(raw);
  return hhmm ? clockMoment(item.date, hhmm) : null;
};

const endMoment = (item, start) => {
  const hhmm = parseClock(item.time_end);
  const end = hhmm ? clockMoment(item.date, hhmm) : start.clone().add(DEFAULT_DURATION_MIN, "minutes");
  if (end.isBefore(start)) end.add(1, "day"); // crossed midnight
  return end;
};

// True when the start time is prayer-relative ("ba'da ...").
export const isPrayerStart = (item) => !!prayerOf(item?.time_start);

/**
 * Resolved clock time of a kajian's start in WIB ("HH:mm"), or null.
 * For "ba'da <prayer>" events this is the real computed prayer time for the
 * kajian's location/date — useful to show users when it actually begins.
 */
export const getResolvedStartClock = (item) => {
  if (!item || !item.date) return null;
  const start = startMoment(item);
  return start && start.isValid() ? start.clone().tz(TZ).format("HH:mm") : null;
};

/**
 * Human "start - end" label. For "ba'da <prayer>" starts it appends the real
 * computed clock time, e.g. "Ba'da Maghrib (17:41) - selesai".
 */
export const formatTimeRange = (item, { endFallback = "selesai" } = {}) => {
  if (!item || !item.time_start) return "";
  const prayer = prayerOf(item.time_start);
  const human = prayer
    ? PRAYER_LABEL[prayer]
    : timeStartMapping[item.time_start] || item.time_start;
  const resolved = prayer ? getResolvedStartClock(item) : null;
  const startLabel = resolved ? `${human} (${resolved})` : human;
  return `${startLabel} - ${item.time_end || endFallback}`;
};

/**
 * Resolved start moment (a moment-timezone object in WIB) for a kajian, or null
 * when its time can't be determined. Useful for "how soon does it start" math.
 */
export const getStartMoment = (item) => {
  if (!item || !item.date) return null;
  const start = startMoment(item);
  return start && start.isValid() ? start : null;
};

/**
 * Whole minutes from `now` until the kajian starts. Positive = starts later,
 * negative = already started, null when the start time can't be resolved.
 */
export const getMinutesUntilStart = (item, now = moment.tz(TZ)) => {
  const start = getStartMoment(item);
  return start ? start.diff(now, "minutes") : null;
};

/**
 * Status of a single kajian relative to `now`:
 *   "upcoming" — will start later
 *   "ongoing"  — happening now
 *   "passed"   — already finished
 * Returns null when the time can't be determined.
 */
export const getKajianStatus = (item, now = moment.tz(TZ)) => {
  if (!item || !item.date) return null;
  const start = startMoment(item);
  if (!start || !start.isValid()) return null;
  const end = endMoment(item, start);

  if (now.isBefore(start)) return "upcoming";
  if (now.isAfter(end)) return "passed";
  return "ongoing";
};

const STATUS_PRIORITY = { ongoing: 3, upcoming: 2, passed: 1 };

/**
 * Combined status for a group of kajian at one location. Shows the most "active"
 * state present: ongoing beats upcoming beats passed. Null if none are parseable.
 */
export const getGroupStatus = (group, now = moment.tz(TZ)) => {
  let best = null;
  for (const item of group || []) {
    const status = getKajianStatus(item, now);
    if (status && (!best || STATUS_PRIORITY[status] > STATUS_PRIORITY[best])) {
      best = status;
    }
  }
  return best;
};
