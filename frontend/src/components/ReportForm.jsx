// Import React hooks for state management and side effects
import { useState, useEffect } from "react";

// Initial form state: Empty values for all fields
const initialState = {
  title: "",
  description: "",
  category: "",
  latitude: "",
  longitude: "",
};

// ReportForm component: Form for submitting new civic issue reports
// Props:
//   - onSubmit: Callback function called when form is submitted
//   - loading: Boolean indicating if form submission is in progress
//   - selectedLocation: Object with lat/lng from map click (or null)
//   - onLocationChange: Callback to clear selected location
function ReportForm({ onSubmit, loading, selectedLocation, onLocationChange }) {
  // State for form field values
  const [values, setValues] = useState(initialState);
  // State for geolocation error message
  const [locationError, setLocationError] = useState(null);

  // Update form coordinates when user clicks on map
  // Automatically populates latitude/longitude fields from map selection
  useEffect(() => {
    if (selectedLocation) {
      setValues((prev) => ({
        ...prev,
        // Format coordinates to 6 decimal places (~10cm precision)
        latitude: selectedLocation.lat.toFixed(6),
        longitude: selectedLocation.lng.toFixed(6),
      }));
    }
  }, [selectedLocation]);

  // Handler for input field changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => {
      const updated = { ...prev, [name]: value };
      // If user manually edits coordinates, clear the map selection
      // This prevents confusion if coordinates don't match the blue marker
      if ((name === "latitude" || name === "longitude") && onLocationChange) {
        onLocationChange(null);
      }
      return updated;
    });
  };

  // Handler for "Use my location" button
  const handleUseLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setValues((prev) => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));
        // Clear any previous location error
        setLocationError(null);
        // Optionally update selected location for map marker
        if (onLocationChange) {
          onLocationChange({ lat: latitude, lng: longitude });
        }
      },
      (error) => {
        // Handle geolocation errors gracefully
        let errorMessage = "Unable to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
          default:
            errorMessage = "An unknown error occurred.";
            break;
        }
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Handler for form submission
  const handleSubmit = async (event) => {
    // Prevent default form submission (page reload)
    event.preventDefault();
    // Call parent's onSubmit handler with form values
    // Convert latitude/longitude strings to numbers for API
    await onSubmit({
      ...values,
      latitude: parseFloat(values.latitude),
      longitude: parseFloat(values.longitude),
    });
    // Reset form to initial empty state after successful submission
    setValues(initialState);
    setLocationError(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Title
        <input
          name="title"
          value={values.title}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          value={values.description}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        Category
        <input
          name="category"
          value={values.category}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        Latitude
        <input
          name="latitude"
          type="number"
          step="any"
          value={values.latitude}
          onChange={handleChange}
          required
        />
        {selectedLocation && (
          <small style={{ color: "#059669", display: "block", marginTop: "0.25rem" }}>
            ✓ Clicked from map
          </small>
        )}
      </label>
      <label>
        Longitude
        <input
          name="longitude"
          type="number"
          step="any"
          value={values.longitude}
          onChange={handleChange}
          required
        />
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
        <button
          type="button"
          onClick={handleUseLocation}
          style={{
            background: "#059669",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          📍 Use my location
        </button>
        {locationError && (
          <small style={{ color: "#dc2626", display: "block" }}>
            {locationError}
          </small>
        )}
        <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
          💡 Tip: Click on the map or use your location to set coordinates automatically
        </p>
      </div>
      <button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Submit Report"}
      </button>
    </form>
  );
}

export default ReportForm;

