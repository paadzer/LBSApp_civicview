// Import React hooks for state management
import { useState } from "react";
// Import API authentication functions
import { register } from "../api";

// Register component: Handles user registration
// Props:
//   - onRegisterSuccess: Callback function called when registration is successful
//   - onSwitchToLogin: Callback to switch back to login screen
function Register({ onRegisterSuccess, onSwitchToLogin }) {
  // State for form field values
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  // State for error message
  const [error, setError] = useState(null);
  // State for loading (during registration request)
  const [loading, setLoading] = useState(false);

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      // Attempt to register with provided credentials
      await register(username, email, password, passwordConfirm);
      // Call success callback to update parent component
      onRegisterSuccess();
    } catch (err) {
      // Display error message if registration fails
      setError(
        err.response?.data?.error ||
        "Error creating account. Please try again."
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
          <p>Create a new account</p>
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
              placeholder="Choose a username"
              minLength={3}
            />
          </label>

          <label>
            Email (optional)
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="At least 8 characters"
              minLength={8}
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              placeholder="Re-enter your password"
              minLength={8}
            />
          </label>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              style={{
                background: "none",
                border: "none",
                color: "#667eea",
                cursor: "pointer",
                textDecoration: "underline",
                padding: 0,
                fontSize: "0.875rem",
              }}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;