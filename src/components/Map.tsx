import React, { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function Map() {
  useEffect(() => {
    // Initialize the map
    const map = L.map("map").setView([20.5937, 78.9629], 5);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add a sample marker
    L.marker([20.5937, 78.9629])
      .addTo(map)
      .bindPopup("Map center")
      .openPopup();

    // Add click event to map
    map.on("click", () => {
      window.open("", "_blank"); // Opens a new blank tab
    });

    // Cleanup on unmount
    return () => {
      map.remove();
    };
  }, []);

  return (
    <div
      id="map"
      style={{
        height: "500px",
        width: "100%",
      }}
    ></div>
  );
}

export default Map;
