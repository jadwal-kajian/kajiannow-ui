
import moment from 'moment-timezone'

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

export const convertDateTime = (value) => {
  const formattedDate = moment.tz(value.last_update, "YYYY-MM-DD HH:mm:ss", "Asia/Jakarta").format("DD MMMM YYYY, HH:mm [WIB]");
  return formattedDate;
}