import moment from "moment-timezone";
import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";

// Kajian schedules are in Western Indonesia time (Jawa Barat = WIB).
const TZ = "Asia/Jakarta";

// Assumed length when an event has no explicit end time.
const DEFAULT_DURATION_MIN = 90;

// Minutes after the adhan that a "ba'da <prayer>" kajian is treated as starting.
const BADA_OFFSET_MIN = 0;

// Indonesia's Kemenag parameters ≈ adhan's Singapore method (Fajr 20°, Isha 18°).
const calcParams = CalculationMethod.Singapore();

// "ba'da <prayer>" start times -> the corresponding adhan prayer.
const BADA_PRAYER = {
  bada_subuh: "fajr",
  bada_shubuh: "fajr",
  bada_dhuhur: "dhuhr",
  bada_dzuhur: "dhuhr",
  bada_ashar: "asr",
  bada_asar: "asr",
  bada_maghrib: "maghrib",
  bada_isya: "isha",
};

// Rough WIB fallbacks, used only when a kajian has no usable coordinates.
const BADA_TIME_APPROX = {
  bada_subuh: "05:00",
  bada_shubuh: "05:00",
  bada_dhuhur: "12:30",
  bada_dzuhur: "12:30",
  bada_ashar: "15:30",
  bada_asar: "15:30",
  bada_maghrib: "18:30",
  bada_isya: "19:30",
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
  const key = String(raw).toLowerCase().trim();

  const prayer = BADA_PRAYER[key];
  if (prayer) {
    return (
      prayerMoment(item, prayer) ||
      (BADA_TIME_APPROX[key] ? clockMoment(item.date, BADA_TIME_APPROX[key]) : null)
    );
  }

  const hhmm = parseClock(key);
  return hhmm ? clockMoment(item.date, hhmm) : null;
};

const endMoment = (item, start) => {
  const hhmm = parseClock(item.time_end);
  const end = hhmm ? clockMoment(item.date, hhmm) : start.clone().add(DEFAULT_DURATION_MIN, "minutes");
  if (end.isBefore(start)) end.add(1, "day"); // crossed midnight
  return end;
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
