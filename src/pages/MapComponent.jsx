


import React, { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  LoadScript,
  DirectionsRenderer,
  Marker,
} from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyDQmPq0HH1XTcSNa55xUP748V1Vv4hhK1w";

const EnhancedMapComponent = () => {
  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [startLocation, setStartLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [landmarks, setLandmarks] = useState([]);
  const speech = useRef(new SpeechSynthesisUtterance());

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
      },
      (error) => console.error("Geolocation Error:", error),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const geocodeAddress = (address) => {
    return new Promise((resolve, reject) => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK") {
          const location = results[0].geometry.location;
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          reject(`Geocode failed: ${status}`);
        }
      });
    });
  };

  const calculateRoute = async () => {
    if (!startLocation || !destination) {
     
      return;
    }

    try {
      const directionsService = new window.google.maps.DirectionsService();
      const results = await directionsService.route({
        origin: startLocation,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
      setDirectionsResponse(results);
      findNearbyLandmarks(currentLocation);
    } catch (error) {
      console.error("Error calculating route:", error);
    }
  };

  const findNearbyLandmarks = (location) => {
    if (!map || !location || !location.lat || !location.lng) {
      console.error("Invalid map or location:", { map, location });
      return;
    }

    const placesService = new window.google.maps.places.PlacesService(map);
    placesService.nearbySearch(
      {
        location,
        radius: 50,
        type: "point_of_interest",
      },
      (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setLandmarks(results);
          announceLandmarks(results);
        } else {
          console.error("Error fetching landmarks:", status);
        }
      }
    );
  };

  const announceLandmarks = (landmarks) => {
    if (!landmarks || landmarks.length === 0) {
      console.warn("No landmarks to announce.");
      return;
    }

    const names = landmarks.map((place) => place.name).join(", ");
    speech.current.text = `Nearby landmarks are: ${names}`;
    window.speechSynthesis.speak(speech.current);
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
      <GoogleMap
        onLoad={(map) => setMap(map)}
        center={currentLocation || { lat: 0, lng: 0 }}
        zoom={15}
        mapContainerStyle={{ width: "100%", height: "400px" }}
      >
        {startLocation && <Marker position={startLocation} />}
        {destination && <Marker position={destination} />}
        {currentLocation && <Marker position={currentLocation} />}
        {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}
      </GoogleMap>
      <div style={{ marginTop: "10px" }}>
        <input
          type="text"
          placeholder="Enter start location"
          className="border p-2 mr-2"
          onBlur={async (e) => {
            try {
              const location = await geocodeAddress(e.target.value);
              setStartLocation(location);
            } catch (error) {
              console.error(error);
            }
          }}
        />
        <input
          type="text"
          placeholder="Enter destination"
     className="border p-2 mr-2"
          onBlur={async (e) => {
            try {
              const location = await geocodeAddress(e.target.value);
              setDestination(location);
            } catch (error) {
              console.error(error);
            }
          }}
        />
        <button   className="border p-2 mr-2" onClick={calculateRoute} style={{ padding: "10px 20px", cursor: "pointer" }}>
          Calculate Route
        </button>
      </div>
    </LoadScript>
  );
};

export default EnhancedMapComponent;
