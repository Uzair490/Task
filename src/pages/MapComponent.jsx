import React, { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  LoadScript,
  DirectionsRenderer,
  Marker,
} from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyDQmPq0HH1XTcSNa55xUP748V1Vv4hhK1w";

const MapComponent = () => {
  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState("");
  const [landmarks, setLandmarks] = useState([]);

  const speech = useRef(new SpeechSynthesisUtterance());

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
      },
      (error) => console.error(error),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const calculateRoute = async () => {
    if (!currentLocation || !destination) return;

    const directionsService = new window.google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: currentLocation,
      destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
    });

    setDirectionsResponse(results);
    findNearbyLandmarks(currentLocation);
  };

  const findNearbyLandmarks = async (location) => {
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
          if (results.length > 0) {
            announceLandmarks(results);
          }
        }
      }
    );
  };

  const announceLandmarks = (landmarks) => {
    const names = landmarks.map((place) => place.name).join(", ");
    if (names) {
      speech.current.text = `Nearby landmarks: ${names}`;
      window.speechSynthesis.speak(speech.current);
    }
  };

  const announceArrival = () => {
    if (destination && currentLocation) {
      const distance =
        window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(currentLocation),
          new window.google.maps.LatLng(destination)
        );

      if (distance < 50) {
        speech.current.text = "You have arrived at your destination.";
        window.speechSynthesis.speak(speech.current);
      }
    }
  };

  useEffect(() => {
    if (currentLocation && destination) {
      calculateRoute();
      announceArrival();
    }
  }, [currentLocation]);

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div className="p-4">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            className="p-2 border rounded"
            placeholder="Enter destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={calculateRoute}
          >
            Get Route
          </button>
        </div>
        <GoogleMap
          center={currentLocation || { lat: 0, lng: 0 }}
          zoom={15}
          mapContainerStyle={{ width: "100%", height: "500px" }}
          onLoad={(map) => setMap(map)}
        >
          {currentLocation && <Marker position={currentLocation} />}
          {destination && <Marker position={destination} />}
          {directionsResponse && (
            <DirectionsRenderer directions={directionsResponse} />
          )}
        </GoogleMap>
      </div>
    </LoadScript>
  );
};

export default MapComponent;

// test