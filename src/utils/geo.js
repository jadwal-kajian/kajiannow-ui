// Great-circle distance between two {lat, lng} points, in kilometers.
// Returns Infinity if either point is missing/invalid, so callers can safely
// compare against a radius without extra guards.
const toRad = (deg) => (deg * Math.PI) / 180;

export const distanceKm = (a, b) => {
  if (!a || !b) return Infinity;
  if (typeof a.lat !== "number" || typeof a.lng !== "number") return Infinity;
  if (typeof b.lat !== "number" || typeof b.lng !== "number") return Infinity;

  const R = 6371; // mean Earth radius (km)
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export default distanceKm;
