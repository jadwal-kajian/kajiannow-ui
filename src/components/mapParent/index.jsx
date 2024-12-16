import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
} from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import { MapMarker, UserMapMarker } from "components/mapMarker";
import PropTypes from "prop-types";

const MapParent = forwardRef(
  ({ locations, showAllInfo, center, zoom }, ref) => {
    const mapInstance = useRef(null);
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
      if (mapInstance.current) {
        mapInstance.current.panTo(center);
        mapInstance.current.setZoom(zoom);
      }
    }, [center, zoom]);

    useEffect(() => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
          },
          (error) => {
            console.error("Error getting current location:", error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
      }
    }, []);

    useImperativeHandle(ref, () => ({
      setCenter: (coords) => {
        if (mapInstance.current) {
          mapInstance.current.panTo(coords);
          mapInstance.current.setZoom(15);
        }
      },
    }));

    return (
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={{
            width: "100%",
            height: "calc(80vh - 250px)",
            borderRadius: 12,
            marginBottom: 12,
          }}
          center={center}
          zoom={zoom}
          onLoad={(map) => (mapInstance.current = map)}
          onUnmount={() => (mapInstance.current = null)}
          options={{
            mapId: "4504f8b37365c3d0",
            disableDefaultUI: false,
            mapTypeControl: false,
            zoomControl: true,
            streetViewControl: false,
            gestureHandling: "greedy",
          }}
        >
          {userLocation && (
            <UserMapMarker key="user-location" location={userLocation} />
          )}
          {locations.map((location, index) => (
            <MapMarker
              key={location.id || `${location.lat}-${location.lng}-${index}`}
              location={location}
              locations={locations}
              showAllInfo={showAllInfo}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    );
  }
);

MapParent.displayName = "MapParent";

MapParent.propTypes = {
  locations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
      city: PropTypes.string.isRequired,
    })
  ).isRequired,
  showAllInfo: PropTypes.bool,
  center: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }).isRequired,
  zoom: PropTypes.number.isRequired,
};

export default MapParent;
