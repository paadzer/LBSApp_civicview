// Import Axios for making HTTP requests to the Django API
import axios from "axios";

// Create Axios instance with base URL for all API requests
// Points to Django REST Framework API endpoint
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

// Fetch all reports from the API
// Returns a promise that resolves to the list of civic reports
export const fetchReports = () => api.get("reports/");

// Fetch all hotspot clusters from the API
// Returns a promise that resolves to the list of detected hotspots
export const fetchHotspots = () => api.get("hotspots/");

// Create a new civic report
// payload: Object containing title, description, category, latitude, longitude
// Returns a promise that resolves to the created report
export const createReport = (payload) => api.post("reports/", payload);

// Fetch points of interest near a location using Overpass API
// params: Object with lat, lon, radius (optional), type (optional)
// Returns a promise that resolves to POI data
export const fetchPOIs = (params) => {
  const queryParams = new URLSearchParams();
  queryParams.append("lat", params.lat);
  queryParams.append("lon", params.lon);
  if (params.radius) queryParams.append("radius", params.radius);
  if (params.type) queryParams.append("type", params.type);
  return api.get(`pois/?${queryParams.toString()}`);
};

// Export the api instance for direct use if needed
export default api;


