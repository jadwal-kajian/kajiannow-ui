import moment from 'moment-timezone';

export const convertDateTime = (value) => {
  const daysInIndonesian = [
    "Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"
  ];

  const dayIndex = moment(value.last_update).day();
  const dayInIndonesian = daysInIndonesian[dayIndex];

  const formattedDate = moment(value.last_update).format(`dddd, D MMMM YYYY`);
  return formattedDate.replace(moment(value.last_update).format('dddd'), dayInIndonesian);
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