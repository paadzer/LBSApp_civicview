// Import React hooks for state management and side effects
import { useEffect, useState } from "react";
// Import API functions for communicating with Django backend
import { createReport, fetchHotspots, fetchReports, isAuthenticated, getCurrentUser, logout } from "./api";
// Import React components
import MapView from "./components/MapView";
import ReportForm from "./components/ReportForm";
import Login from "./components/Login";

// Main App component: Root component of the React application
function App() {
  // State for authentication
  const [authenticated, setAuthenticated] = useState(false);
  // State for storing all civic reports from the API
  const [reports, setReports] = useState([]);
  // State for storing all hotspot clusters from the API
  const [hotspots, setHotspots] = useState([]);
  // Loading state: true when fetching data from API
  const [loading, setLoading] = useState(false);
  // Error state: stores error message if API request fails
  const [error, setError] = useState(null);
  // Selected location state: stores lat/lng when user clicks on map
  const [selectedLocation, setSelectedLocation] = useState(null);
  // Current user state
  const [user, setUser] = useState(null);

  // Check authentication on component mount
  useEffect(() => {
    if (isAuthenticated()) {
      setAuthenticated(true);
      setUser(getCurrentUser());
    }
  }, []);

  // Function to load reports and hotspots from the API
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both reports and hotspots in parallel for better performance
      const [reportsRes, hotspotsRes] = await Promise.all([
        fetchReports(),
        fetchHotspots(),
      ]);
      // Update state with fetched data
      setReports(reportsRes.data);
      setHotspots(hotspotsRes.data);
    } catch (err) {
      // Display error message if API request fails
      setError("Unable to load data from the API.");
    } finally {
      setLoading(false);
    }
  };

  // Load data when authenticated
  useEffect(() => {
    if (authenticated) {
      loadData();
    }
  }, [authenticated]);

  // Handler for successful login
  const handleLoginSuccess = () => {
    setAuthenticated(true);
    setUser(getCurrentUser());
  };

  // Handler for logout
  const handleLogout = async () => {
    await logout();
    setAuthenticated(false);
    setUser(null);
    setReports([]);
    setHotspots([]);
  };

  // Handler for report form submission
  const handleSubmit = async (values) => {
    setError(null);
    try {
      // Send new report to API
      await createReport(values);
      // Reload data to show the new report and updated hotspots
      await loadData();
      // Clear selected location after successful submission
      setSelectedLocation(null);
    } catch (err) {
      // Display error message if submission fails
      setError("Unable to submit the report.");
    }
  };

  // Handler for map clicks: Updates selected location with clicked coordinates
  const handleMapClick = (lat, lng) => {
    setSelectedLocation({ lat, lng });
  };

  // Show login screen if not authenticated
  if (!authenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Show main application if authenticated
  return (
    <main className="layout">
      <section className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h1>Civic View</h1>
            <p>Report civic issues and see hotspots detected with DBSCAN.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
            {user && (
              <span style={{ fontSize: "0.9rem", color: "#64748b" }}>
                Welcome, {user.username}
              </span>
            )}
            <button
              onClick={handleLogout}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}
        <ReportForm 
          onSubmit={handleSubmit} 
          loading={loading}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
        />
      </section>
      <section className="panel">
        <MapView 
          reports={reports} 
          hotspots={hotspots}
          selectedLocation={selectedLocation}
          onMapClick={handleMapClick}
        />
      </section>
    </main>
  );
}

export default App;


