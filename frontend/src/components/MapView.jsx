// Import React hooks for state management and side effects
import { useEffect, useState } from "react";
// Import React-Leaflet components for interactive map
import { MapContainer, Marker, Polygon, Popup, TileLayer, Tooltip, useMapEvents, useMap } from "react-leaflet";
// Import Leaflet CSS for map styling
import "leaflet/dist/leaflet.css";
// Import Leaflet library for icon configuration
import L from "leaflet";
// Import API function for fetching POIs
import { fetchPOIs } from "../api";

// Default red marker icon for displaying reports on the map
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Blue marker icon for showing the selected location (when user clicks map)
const selectedMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Purple marker icon for POIs (Points of Interest)
const poiMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Default map center: Ireland center coordinates (approximate center of the country)
const IRELAND_CENTER = [53.4129, -8.2439];
// Default zoom level: Shows entire country
const IRELAND_ZOOM = 7;

// Component to handle map clicks: Captures click events and passes coordinates to parent
// Uses useMapEvents hook to listen for click events on the map
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      // Extract latitude and longitude from click event and pass to parent component
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  // This component doesn't render anything, it just handles events
  return null;
}

// Component to programmatically change map view (center and zoom)
// Used when user's geolocation is detected or map needs to be repositioned
function SetMapView({ center, zoom }) {
  // Get map instance from React-Leaflet context
  const map = useMap();
  
  // Update map view when center or zoom changes
  useEffect(() => {
    if (center) {
      // Smoothly animate to new center and zoom level
      map.setView(center, zoom, {
        animate: true,
        duration: 1.5  // Animation duration in seconds
      });
    }
  }, [center, zoom, map]);
  
  // This component doesn't render anything, it just updates map view
  return null;
}

// MapView component: Displays interactive map with reports, hotspots, and user location
// Props:
//   - reports: Array of report objects with geom (GeoJSON) property
//   - hotspots: Array of hotspot objects with geom (GeoJSON) property
//   - selectedLocation: Object with lat/lng from map click (or null)
//   - onMapClick: Callback function called when user clicks on map
function MapView({ reports, hotspots, selectedLocation, onMapClick }) {
  // State for map center coordinates [latitude, longitude]
  const [mapCenter, setMapCenter] = useState(IRELAND_CENTER);
  // State for map zoom level (higher = more zoomed in)
  const [mapZoom, setMapZoom] = useState(IRELAND_ZOOM);
  // State for user's current location (if geolocation is available)
  const [userLocation, setUserLocation] = useState(null);
  // State for geolocation error message (if geolocation fails)
  const [locationError, setLocationError] = useState(null);
  // State for POIs (Points of Interest)
  const [pois, setPois] = useState([]);
  // State for POI toggle (show/hide POIs)
  const [showPOIs, setShowPOIs] = useState(false);
  // State for POI loading
  const [poisLoading, setPoisLoading] = useState(false);
  // State for POI error
  const [poisError, setPoisError] = useState(null);

  // Get user's current location on component mount using browser geolocation API
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        // Success callback: User location retrieved successfully
        (position) => {
          const { latitude, longitude } = position.coords;
          const userPos = [latitude, longitude];
          setUserLocation(userPos);
          
          // Check if user is roughly in Ireland (bounding box check)
          // Ireland approximate bounds: lat 51.4-55.4, lon -11.0 to -5.0
          if (
            latitude >= 51.4 && latitude <= 55.4 &&
            longitude >= -11.0 && longitude <= -5.0
          ) {
            // User is in Ireland, zoom to their location for better UX
            setMapCenter(userPos);
            setMapZoom(11); // Closer zoom for local area
          } else {
            // User is outside Ireland, show Ireland but with a marker for their location
            setMapCenter(IRELAND_CENTER);
            setMapZoom(IRELAND_ZOOM);
          }
        },
        // Error callback: Location access denied or unavailable
        (error) => {
          setLocationError(error.message);
          // Default to Ireland view if geolocation fails
          setMapCenter(IRELAND_CENTER);
          setMapZoom(IRELAND_ZOOM);
        },
        // Geolocation options
        {
          enableHighAccuracy: true,  // Request high accuracy GPS if available
          timeout: 10000,  // Timeout after 10 seconds
          maximumAge: 0  // Don't use cached location, always get fresh data
        }
      );
    } else {
      // Geolocation not supported by browser
      setLocationError("Geolocation is not supported by your browser");
      setMapCenter(IRELAND_CENTER);
      setMapZoom(IRELAND_ZOOM);
    }
  }, []);

  // Load POIs when toggle is enabled or map center changes
  useEffect(() => {
    const loadPOIs = async () => {
      if (!showPOIs) {
        setPois([]);
        return;
      }

      setPoisLoading(true);
      setPoisError(null);
      try {
        const response = await fetchPOIs({
          lat: mapCenter[0],
          lon: mapCenter[1],
          radius: 1000, // 1km radius
        });
        setPois(response.data.pois || []);
      } catch (err) {
        setPoisError("Failed to load POIs");
        console.error("POI fetch error:", err);
      } finally {
        setPoisLoading(false);
      }
    };

    loadPOIs();
  }, [showPOIs, mapCenter]);

  return (
    <div className="map-container" style={{ position: "relative" }}>
      {/* POI Toggle Button */}
      <button
        onClick={() => setShowPOIs(!showPOIs)}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1000,
          background: showPOIs ? "#7c3aed" : "#6b7280",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "0.75rem 1rem",
          fontSize: "0.9rem",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        {showPOIs ? "📍 Hide POIs" : "📍 Show Nearby POIs"}
      </button>
      {poisLoading && (
        <div
          style={{
            position: "absolute",
            top: "50px",
            right: "10px",
            zIndex: 1000,
            background: "#fff",
            padding: "0.5rem",
            borderRadius: "4px",
            fontSize: "0.85rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          Loading POIs...
        </div>
      )}
      {poisError && (
        <div
          style={{
            position: "absolute",
            top: "50px",
            right: "10px",
            zIndex: 1000,
            background: "#fee2e2",
            color: "#dc2626",
            padding: "0.5rem",
            borderRadius: "4px",
            fontSize: "0.85rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          {poisError}
        </div>
      )}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <SetMapView center={mapCenter} zoom={mapZoom} />
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Component that handles map click events */}
        <MapClickHandler onMapClick={onMapClick} />

        {/* User's current location marker (if available and outside Ireland) */}
        {/* Only show if user is outside Ireland bounds to avoid clutter */}
        {userLocation && 
         (userLocation[0] < 51.4 || userLocation[0] > 55.4 || 
          userLocation[1] < -11.0 || userLocation[1] > -5.0) && (
          <Marker
            position={userLocation}
            icon={new L.Icon({
              iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
              iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })}
          >
            <Popup>
              <strong>Your Location</strong>
            </Popup>
          </Marker>
        )}

        {/* Selected location marker: Blue marker showing where user clicked on map */}
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={selectedMarkerIcon}
          >
            <Popup>
              <strong>Selected Location</strong>
              <br />
              Click on the map to change
            </Popup>
          </Marker>
        )}

        {/* Render all reports as red markers on the map */}
        {/* Filter out reports without geometry, then map each to a Marker component */}
        {reports
          .filter((report) => report.geom)
          .map((report) => (
            <Marker
              key={report.id}
              // GeoJSON coordinates are [longitude, latitude], Leaflet needs [lat, lng]
              position={[report.geom.coordinates[1], report.geom.coordinates[0]]}
              icon={markerIcon}
            >
              <Popup>
                <strong>{report.title}</strong>
                <br />
                {report.description}
              </Popup>
            </Marker>
          ))}

        {/* Render all hotspots as orange polygons on the map */}
        {/* Filter out hotspots without geometry, then map each to a Polygon component */}
        {hotspots
          .filter((hotspot) => hotspot.geom)
          .map((hotspot) => (
            <Polygon
              key={hotspot.id}
              // Convert GeoJSON coordinates to Leaflet format
              // GeoJSON: [lng, lat], Leaflet: [lat, lng]
              // coordinates[0] is the outer ring of the polygon
              positions={hotspot.geom.coordinates[0].map((coord) => [
                coord[1],  // latitude
                coord[0],  // longitude
              ])}
              color="#ea580c"  // Orange color for hotspot polygons
            >
              <Tooltip sticky>Cluster {hotspot.cluster_id}</Tooltip>
            </Polygon>
          ))}

        {/* Render POIs (Points of Interest) as purple markers */}
        {showPOIs &&
          pois.map((poi, index) => (
            <Marker
              key={`poi-${index}`}
              position={[poi.latitude, poi.longitude]}
              icon={poiMarkerIcon}
            >
              <Popup>
                <strong style={{ fontSize: "1rem", display: "block", marginBottom: "0.25rem" }}>
                  {poi.name}
                </strong>
                {poi.type && (
                  <span style={{ 
                    fontSize: "0.85rem", 
                    color: "#6b7280",
                    display: "block",
                    fontStyle: "italic"
                  }}>
                    {poi.type}
                  </span>
                )}
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}

export default MapView;

