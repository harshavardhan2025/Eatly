import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (rawVal.startsWith("0")) {
      setPhone(rawVal.slice(1, 11));
    } else {
      setPhone(rawVal.slice(0, 10));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Name Validation
    const nameTrimmed = name.trim();
    if (nameTrimmed.length < 2) {
      setError("Name must be at least 2 characters long.");
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(nameTrimmed)) {
      setError("Name can only contain alphabetic letters and spaces (no numbers or special characters).");
      return;
    }

    // Phone Validation (exactly 10 digits starting with 1-9)
    if (!/^[1-9]\d{9}$/.test(phone)) {
      setError("Please enter a valid 10-digit mobile phone number starting with digits 1 to 9.");
      return;
    }

    // Password Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      await register(nameTrimmed, phone, password);
      navigate("/menu");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        "Registration failed. Phone number may already be registered."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card official-card">
        <div className="auth-header">
          <div className="auth-brand-badge">HERITAGE RESTAURANT</div>
          <h1>Create Account</h1>
          <p>Sign up to start ordering delicious food</p>
        </div>

        {error && (
          <div className="error-banner-box">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="official-form">
          <div className="form-group">
            <label htmlFor="regName">Full Name</label>
            <input
              id="regName"
              type="text"
              placeholder="e.g. Harsha Vardhan"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="regPhone">Mobile Phone Number</label>
            <input
              id="regPhone"
              type="tel"
              maxLength={10}
              placeholder="10-digit mobile number (e.g. 9876543210)"
              required
              value={phone}
              onChange={handlePhoneChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="regPass">Password</label>
            <input
              id="regPass"
              type="password"
              placeholder="Minimum 6 characters"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="regConfirmPass">Confirm Password</label>
            <input
              id="regConfirmPass"
              type="password"
              placeholder="Re-enter password to confirm"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="primary-button full auth-btn">
            {loading ? "⏳ Creating Account..." : "Create Free Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">Sign In</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default Register;
