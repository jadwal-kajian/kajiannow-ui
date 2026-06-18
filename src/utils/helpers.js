import moment from "moment";
import { id } from "date-fns/locale";

export const ID_FormattedDate = (date) => {
  const options = {
    weekday: 'long', // Full weekday name (e.g., "Minggu")
    year: 'numeric', // Full year (e.g., 2024)
    month: 'long', // Full month name (e.g., "November")
    day: 'numeric' // Day as a number (e.g., 12)
  };

  // Get the date formatted in the Indonesian locale
  let formattedDate = new Date(date).toLocaleDateString("id-ID", options);

  // Replace "Minggu" with "Ahad"
  return formattedDate.replace('Minggu', 'Ahad');
}

export const formatDate = (dateString) => {
  const options = { day: "numeric", month: "long", year: "numeric" };
  return new Date(dateString).toLocaleDateString("id-ID", options);
}

export const convertToDDMMYYYY = (date) => {
  return moment(date).format("DD-MM-YYYY");
};

export const convertToYYYYMMDD = (date) => {
  return moment(date).format("YYYY-MM-DD");
};

export const groupTopicsByLocation = (targetLat, targetLng, locations) => {
  // Filter location based on lat & lng
  const sameLocations = locations.filter(
    (location) => location.lat === targetLat && location.lng === targetLng
  );

  // if found the same location, grab the topic
  if (sameLocations.length > 0) {
    return sameLocations.map((location) => location);
  } else {
    return []; // no location matches
  }
};

export const serialize = (obj) => {
  var str = [];
  for (var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
};

export const getDynamicCategory = (data) => {
  const alltags = [];
  data.forEach(el => {
    const itemTags = el.tags.split(",").map((tag) => tag.trim());
    alltags.push(...itemTags)
  });
  const tags = [...new Set(alltags)];
  return tags;
}

export const customIdLocale = {
  ...id,
  localize: {
    ...id.localize,
    day: (n) => ["Aha", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][n], // Customize weekday abbreviations
  },
};

export const timeStartMapping = {
  bada_subuh: "Ba'da Subuh",
  bada_shubuh: "Ba'da Subuh",
  bada_dhuhur: "Ba'da Dzuhur",
  bada_dzuhur: "Ba'da Dzuhur",
  bada_ashar: "Ba'da Ashar",
  bada_asar: "Ba'da Ashar",
  bada_maghrib: "Ba'da Maghrib",
  bada_isya: "Ba'da Isya'",
  bada_jumat: "Ba'da Jum'at",
};
