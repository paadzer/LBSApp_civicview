// Import React hooks for state management
import { useState } from "react";
// Import API authentication functions
import { login } from "../api";

// Login component: Handles user authentication
// Props:
//   - onLoginSuccess: Callback function called when login is successful
function Login({ onLoginSuccess }) {
  // State for form field values
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // State for error message
  const [error, setError] = useState(null);
  // State for loading (during login request)
  const [loading, setLoading] = useState(false);

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Attempt to login with provided credentials
      await login(username, password);
      // Call success callback to update parent component
      onLoginSuccess();
    } catch (err) {
      // Display error message if login fails
      setError(
        err.response?.data?.error ||
        "Invalid username or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Civic View</h1>
          <p>Sign in to report civic issues</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              placeholder="Enter your username"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </label>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account? Contact your administrator to create one.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;