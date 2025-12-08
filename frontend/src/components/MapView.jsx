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

// Different colored marker icons for different POI categories
const poiMarkerIcons = {
  amenity: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  tourism: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  shop: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
    iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  leisure: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
    iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  healthcare: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  default: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
    iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
};

// Default map center: Ireland center coordinates (approximate center of the country)
const IRELAND_CENTER = [53.4129, -8.2439];
// Default zoom level: Shows entire country
const IRELAND_ZOOM = 7;

// Component to handle map clicks: Captures click events and passes coordinates to parent
// Uses useMapEvents hook to listen for click events on the map
function MapClickHandler({ onMapClick, onMapClickForPOIs }) {
  useMapEvents({
    click: (e) => {
      // Extract latitude and longitude from click event and pass to parent component
      onMapClick(e.latlng.lat, e.latlng.lng);
      // Also trigger POI loading if enabled
      if (onMapClickForPOIs) {
        onMapClickForPOIs(e.latlng.lat, e.latlng.lng);
      }
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
  // State for POI search location (where user clicked on map)
  const [poiSearchLocation, setPoiSearchLocation] = useState(null);
  // State for POI category filters (which categories to show)
  const [poiCategoryFilters, setPoiCategoryFilters] = useState({
    amenity: true,
    tourism: true,
    shop: true,
    leisure: true,
    healthcare: true,
  });
  // State for POI type filter (specific types like "amenity=fuel", "tourism=hotel", etc.)
  const [poiTypeFilter, setPoiTypeFilter] = useState("all");
  // State for showing filter panel
  const [showFilterPanel, setShowFilterPanel] = useState(false);

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

  // Load POIs when toggle is enabled or when user clicks on map
  useEffect(() => {
    const loadPOIs = async () => {
      if (!showPOIs) {
        setPois([]);
        setPoiSearchLocation(null);
        return;
      }

      // Don't load if no search location has been set yet (wait for user to click)
      if (!poiSearchLocation) {
        return;
      }

      setPoisLoading(true);
      setPoisError(null);
      try {
        const params = {
          lat: poiSearchLocation[0],
          lon: poiSearchLocation[1],
          radius: 5000, // 5km radius
        };
        
        // Add type filter if not "all"
        if (poiTypeFilter !== "all") {
          params.type = poiTypeFilter;
        }
        
        const response = await fetchPOIs(params);
        setPois(response.data.pois || []);
      } catch (err) {
        setPoisError("Failed to load POIs");
        console.error("POI fetch error:", err);
      } finally {
        setPoisLoading(false);
      }
    };

    loadPOIs();
  }, [showPOIs, poiSearchLocation, poiTypeFilter]);

  // Handle map click for POI loading
  const handleMapClickForPOIs = (lat, lng) => {
    if (showPOIs) {
      setPoiSearchLocation([lat, lng]);
    }
  };

  // Get icon for POI based on category
  const getPoiIcon = (poi) => {
    const category = poi.category || "default";
    return poiMarkerIcons[category] || poiMarkerIcons.default;
  };

  // Filter POIs based on category filters
  const filteredPois = pois.filter(poi => {
    if (!poi.category) return true; // Show POIs without category
    return poiCategoryFilters[poi.category] !== false;
  });

  // Common POI types for filter dropdown
  const poiTypeOptions = [
    { value: "all", label: "All Types" },
    { value: "amenity=fuel", label: "Petrol Stations" },
    { value: "amenity=restaurant", label: "Restaurants" },
    { value: "amenity=cafe", label: "Cafés" },
    { value: "amenity=pub", label: "Pubs" },
    { value: "amenity=fast_food", label: "Fast Food" },
    { value: "tourism=hotel", label: "Hotels" },
    { value: "tourism=hostel", label: "Hostels" },
    { value: "tourism=museum", label: "Museums" },
    { value: "shop=supermarket", label: "Supermarkets" },
    { value: "leisure=park", label: "Parks" },
    { value: "healthcare=hospital", label: "Hospitals" },
    { value: "healthcare=pharmacy", label: "Pharmacies" },
  ];

  return (
    <div className="map-container" style={{ position: "relative" }}>
      {/* POI Controls Panel */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {/* POI Toggle Button */}
        <button
          onClick={() => {
            setShowPOIs(!showPOIs);
            if (!showPOIs) {
              setShowFilterPanel(true);
            } else {
              setPois([]);
              setPoiSearchLocation(null);
            }
          }}
          style={{
            background: showPOIs ? "#7c3aed" : "#6b7280",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            fontSize: "0.9rem",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            whiteSpace: "nowrap",
          }}
        >
          {showPOIs ? "📍 Hide POIs" : "📍 Show POIs"}
        </button>

        {/* Filter Panel Toggle */}
        {showPOIs && (
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            style={{
              background: showFilterPanel ? "#4f46e5" : "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0.5rem 0.75rem",
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {showFilterPanel ? "▼ Filters" : "▶ Filters"}
          </button>
        )}

        {/* Filter Panel */}
        {showPOIs && showFilterPanel && (
          <div
            style={{
              background: "#fff",
              borderRadius: "8px",
              padding: "1rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              minWidth: "250px",
              maxWidth: "300px",
            }}
          >
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  color: "#374151",
                }}
              >
                POI Type:
              </label>
              <select
                value={poiTypeFilter}
                onChange={(e) => setPoiTypeFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  fontSize: "0.85rem",
                }}
              >
                {poiTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  color: "#374151",
                }}
              >
                Categories:
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {Object.keys(poiCategoryFilters).map((category) => (
                  <label
                    key={category}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={poiCategoryFilters[category]}
                      onChange={(e) =>
                        setPoiCategoryFilters({
                          ...poiCategoryFilters,
                          [category]: e.target.checked,
                        })
                      }
                      style={{ cursor: "pointer" }}
                    />
                    <span style={{ textTransform: "capitalize" }}>{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {poiSearchLocation && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.5rem",
                  background: "#f3f4f6",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  color: "#6b7280",
                }}
              >
                Click map to load POIs within 5km
              </div>
            )}
          </div>
        )}
      </div>
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
        <MapClickHandler 
          onMapClick={onMapClick} 
          onMapClickForPOIs={handleMapClickForPOIs}
        />

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

        {/* Render POIs (Points of Interest) with category-based colored markers */}
        {showPOIs &&
          filteredPois.map((poi, index) => (
            <Marker
              key={`poi-${index}`}
              position={[poi.latitude, poi.longitude]}
              icon={getPoiIcon(poi)}
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
                {poi.category && (
                  <span style={{ 
                    fontSize: "0.75rem", 
                    color: "#9ca3af",
                    display: "block",
                    marginTop: "0.25rem",
                    textTransform: "capitalize"
                  }}>
                    {poi.category}
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

