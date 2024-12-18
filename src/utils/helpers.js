import moment from 'moment-timezone';

export const convertDateTime = (value) => {
  const daysInIndonesian = [
    "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"
  ];

  const monthsInIndonesian = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const dayIndex = moment(value.last_update).day();
  const dayInIndonesian = daysInIndonesian[dayIndex];

  const dateObject = moment(value.last_update);
  const day = dateObject.date(); // Tanggal
  const monthIndex = dateObject.month(); // Indeks bulan (0-11)
  const year = dateObject.year(); // Tahun

  const monthInIndonesian = monthsInIndonesian[monthIndex];

  // Format tanggal
  const formattedDate = `${dayInIndonesian}, ${day} ${monthInIndonesian} ${year}`;
  return formattedDate;
}

export const groupTopicsByLocation = (targetLat, targetLng, locations) => {
  // Filter location based on lat & lng
  const sameLocations = locations.filter((location) => location.lat === targetLat && location.lng === targetLng);

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