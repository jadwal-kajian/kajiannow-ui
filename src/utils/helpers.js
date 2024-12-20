import moment from "moment";

export const convertDateTime = (value) => {
  const daysInIndonesian = [
    "Ahad",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jum'at",
    "Sabtu",
  ];

  const dayIndex = moment(value.last_update).day();
  const dayInIndonesian = daysInIndonesian[dayIndex];

  const formattedDate = moment(value.last_update).format(`dddd, D MMMM YYYY`);
  return formattedDate.replace(
    moment(value.last_update).format("dddd"),
    dayInIndonesian
  );
};

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
