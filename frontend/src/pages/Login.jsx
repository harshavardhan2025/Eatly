import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const SUPPORT_PHONE = "9866963013";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPopup, setShowForgotPopup] = useState(false);

  const handlePhoneChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    // Prevent starting with 0
    if (rawVal.startsWith("0")) {
      setPhone(rawVal.slice(1, 11));
    } else {
      setPhone(rawVal.slice(0, 10));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Phone validation (exactly 10 digits starting with 1-9)
    if (!/^[1-9]\d{9}$/.test(phone)) {
      setError("Please enter a valid 10-digit mobile phone number starting with digits 1 to 9.");
      return;
    }

    setLoading(true);

    try {
      const loggedInUser = await login(phone, password);
      const isUserAdmin = loggedInUser && (loggedInUser.role === "admin" || phone === "9999999999");
      
      // If on the admin login page, restrict to admin users only
      if (location.pathname === "/admin/login" && !isUserAdmin) {
        throw new Error("Access Denied: You do not have administrator privileges.");
      }

      if (isUserAdmin) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        err.message ||
        "Invalid phone number or password."
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
          <h1>Welcome Back</h1>
          <p>Log in to access your orders and account</p>
        </div>

        {error && (
          <div className="error-banner-box">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="official-form">
          <div className="form-group">
            <label htmlFor="phoneInput">Mobile Phone Number</label>
            <input
              id="phoneInput"
              type="tel"
              maxLength={10}
              placeholder="10-digit mobile number (e.g. 9876543210)"
              value={phone}
              onChange={handlePhoneChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="passwordInput">Password</label>
            <input
              id="passwordInput"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div style={{ marginTop: '8px', fontSize: '12px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowForgotPopup(true)}
                style={{ color: '#d97706', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
              >
                Forgot password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="primary-button full auth-btn"
            disabled={loading}
          >
            {loading ? "🔐 Authenticating..." : "Sign In to Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Create New Account
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password — Call to Reset Modal */}
      {showForgotPopup && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.88)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}
          onClick={() => setShowForgotPopup(false)}
        >
          <div
            style={{
              background: 'linear-gradient(160deg, #1a2332 0%, #0f172a 100%)',
              border: '1px solid rgba(217, 119, 6, 0.4)',
              boxShadow: '0 30px 60px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06) inset',
              padding: '44px 36px',
              borderRadius: '28px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              position: 'relative',
              animation: 'fadeInUp 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowForgotPopup(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#9ca3af', width: '34px', height: '34px',
                borderRadius: '50%', fontSize: '16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              ✕
            </button>

            {/* Lock Icon */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(217,119,6,0.15), rgba(217,119,6,0.05))',
              border: '1.5px solid rgba(217, 119, 6, 0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', margin: '0 auto 22px auto',
              boxShadow: '0 0 30px rgba(217,119,6,0.2)'
            }}>
              🔐
            </div>

            <h2 style={{ marginBottom: '10px', color: '#ffffff', fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
              Reset Your Password
            </h2>

            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '28px' }}>
              For account security, password resets are handled by our support team.<br />
              Please call us and we'll verify your identity and reset your password immediately.
            </p>

            {/* Security Notice */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '18px' }}>🛡️</span>
              <p style={{ color: '#6ee7b7', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
                <strong>Secure Verification:</strong> Our team will verify your registered name and details before resetting.
              </p>
            </div>

            {/* Call Button */}
            <a
              href={`tel:${SUPPORT_PHONE}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                color: '#ffffff',
                padding: '16px 24px',
                borderRadius: '14px',
                fontWeight: '800',
                fontSize: '18px',
                textDecoration: 'none',
                letterSpacing: '0.5px',
                boxShadow: '0 8px 20px rgba(22, 163, 74, 0.35)',
                transition: 'all 0.2s',
                marginBottom: '14px'
              }}
            >
              {/* Phone SVG Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              {SUPPORT_PHONE}
            </a>

            <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
              Available daily · 9 AM – 10 PM IST
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

export default Login;
