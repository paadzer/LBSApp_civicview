// Import Axios for making HTTP requests to the Django API
import axios from "axios";

// Create Axios instance with base URL for all API requests
// Points to Django REST Framework API endpoint
const api = axios.create({
  baseURL: "https://lbsappcivicview-production.up.railway.app/api/",
});

// Get token from localStorage and set as default header
const token = localStorage.getItem("authToken");
if (token) {
  api.defaults.headers.common["Authorization"] = `Token ${token}`;
}

// Interceptor to handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear it and redirect to login
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// Authentication functions
export const login = async (username, password) => {
  const response = await api.post("login/", { username, password });
  // Store token and user info
  localStorage.setItem("authToken", response.data.token);
  localStorage.setItem("user", JSON.stringify(response.data.user));
  // Set authorization header for future requests
  api.defaults.headers.common["Authorization"] = `Token ${response.data.token}`;
  return response.data;
};

export const logout = async () => {
  try {
    await api.post("logout/");
  } catch (error) {
    console.error("Logout error:", error);
  }
  // Clear token and user info
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  delete api.defaults.headers.common["Authorization"];
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("authToken");
};

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


