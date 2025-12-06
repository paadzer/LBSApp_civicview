// Import React hooks for state management and side effects
import { useEffect, useState } from "react";
// Import API functions for communicating with Django backend
import { createReport, fetchHotspots, fetchReports } from "./api";
// Import React components
import MapView from "./components/MapView";
import ReportForm from "./components/ReportForm";

// Main App component: Root component of the React application
function App() {
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

  // Load data when component first mounts (on page load)
  useEffect(() => {
    loadData();
  }, []);

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

  return (
    <main className="layout">
      <section className="panel">
        <h1>Civic View</h1>
        <p>Report civic issues and see hotspots detected with DBSCAN.</p>
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


