import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import MapMarker from "components/mapMarker";
import PropTypes from "prop-types";

const MapParent = forwardRef(({ locations, showAllInfo }, ref) => {
  const mapInstance = useRef(null);
  const [center, setCenter] = useState({ lat: -6.2088, lng: 106.8456 });
  const [zoom, setZoom] = useState(12);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setCenter(newLocation);
          setUserLocation(newLocation);
        },
        (error) => {
          console.error("Error getting current location:", error);
          handleLocationError(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      alert("Geolocation is not supported by this browser.");
    }
  }, []);

  const handleLocationError = (error) => {
    let message = "An error occurred while trying to get your location.";
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = "Please enable location services in your browser settings.";
        break;
      case error.POSITION_UNAVAILABLE:
        message = "Location information is unavailable. Please try again.";
        break;
      case error.TIMEOUT:
        message =
          "The request to get your location timed out. Please try again.";
        break;
    }
    alert(message);
  };

  useImperativeHandle(ref, () => ({
    setCenter: (coords) => {
      setCenter(coords);
      setZoom(15);
      setUserLocation(coords);
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
          height: "calc(100vh - 250px)",
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
          <Marker
            position={userLocation}
            icon={{
              path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
              scale: 7,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            }}
          />
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
});

MapParent.displayName = "MapParent";

MapParent.propTypes = {
  locations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
    })
  ).isRequired,
  showAllInfo: PropTypes.bool,
};

export default MapParent;
