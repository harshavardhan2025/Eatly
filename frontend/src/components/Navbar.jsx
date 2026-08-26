import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { 
  Home, 
  BookOpen, 
  Package, 
  ShoppingCart, 
  LogIn, 
  LogOut, 
  UserPlus, 
  User, 
  Shield, 
  Menu as MenuIcon, 
  X, 
  UtensilsCrossed,
  MessageSquare,
  Users
} from "lucide-react";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;
  const isAdminMode = isAdmin || user?.role === "admin" || location.pathname.startsWith("/admin");

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to={isAdminMode ? "/admin" : "/"} className="logo" onClick={() => setMobileOpen(false)}>
            <UtensilsCrossed className="logo-icon" size={24} color="#f59e0b" />
            <span className="logo-text">
              Heritage <span className="logo-accent">{isAdminMode ? "Admin" : "Restaurant"}</span>
              <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "6px", fontWeight: "500", textTransform: "none" }}>by Eatly</span>
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Nav Links (Desktop + Mobile Dropdown) */}
            <div className={`nav-links ${mobileOpen ? "mobile-active" : ""}`}>
              {isAdminMode ? (
                <>
                  <Link to="/admin" className={`nav-item ${isActive("/admin") ? "active" : ""}`} onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={18} /> Admin Dashboard
                  </Link>
                  <div className="user-menu">
                    <span className="user-badge" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield size={16} /> Admin
                    </span>
                    <button onClick={handleLogout} className="nav-logout-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/" className={`nav-item ${isActive("/") ? "active" : ""}`} onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Home size={18} /> Home
                  </Link>

                  <Link to="/menu" className={`nav-item ${isActive("/menu") ? "active" : ""}`} onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={18} /> Menu
                  </Link>

                  {user && (
                    <Link to="/orders" className={`nav-item ${isActive("/orders") ? "active" : ""}`} onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Package size={18} /> My Orders
                    </Link>
                  )}

                  {isAdmin && (
                    <Link to="/admin" className={`nav-item admin-link ${isActive("/admin") ? "active" : ""}`} onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield size={18} /> Admin
                    </Link>
                  )}

                  <Link to="/cart" className="cart-nav-btn" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShoppingCart size={18} />
                    <span>Cart</span>
                    {cartCount > 0 && (
                      <span className="cart-count-badge">{cartCount}</span>
                    )}
                  </Link>

                  {user ? (
                    <div className="user-menu">
                      <span className="user-badge" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> {user.name}</span>
                        <span style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>{user.phone}</span>
                      </span>
                      <button onClick={handleLogout} className="nav-logout-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  ) : (
                    <div className="auth-btns">
                      <Link to="/login" className="login-link" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <LogIn size={18} /> Login
                      </Link>
                      <Link to="/register" className="register-btn" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserPlus size={18} /> Register
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              className="mobile-hamburger"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Fixed Bottom App Bar */}
      {isAdminMode ? (
        <div className="mobile-bottom-nav admin-mobile-bottom-nav">
          <Link to="/admin?tab=orders" className={`mobile-nav-item ${isActive("/admin") && (!location.search || location.search.includes("tab=orders")) ? "active" : ""}`}>
            <Package className="mobile-nav-icon" size={20} />
            <span className="mobile-nav-label">Orders</span>
          </Link>

          <Link to="/admin?tab=menu" className={`mobile-nav-item ${location.search.includes("tab=menu") ? "active" : ""}`}>
            <BookOpen className="mobile-nav-icon" size={20} />
            <span className="mobile-nav-label">Menu</span>
          </Link>

          <Link to="/admin?tab=complaints" className={`mobile-nav-item ${location.search.includes("tab=complaints") ? "active" : ""}`}>
            <MessageSquare className="mobile-nav-icon" size={20} />
            <span className="mobile-nav-label">Complaints</span>
          </Link>

          <Link to="/admin?tab=users" className={`mobile-nav-item ${location.search.includes("tab=users") ? "active" : ""}`}>
            <Users className="mobile-nav-icon" size={20} />
            <span className="mobile-nav-label">Customers</span>
          </Link>
        </div>
      ) : (
        <div className="mobile-bottom-nav">
          <Link to="/" className={`mobile-nav-item ${isActive("/") ? "active" : ""}`}>
            <Home className="mobile-nav-icon" size={20} />
            <span className="mobile-nav-label">Home</span>
          </Link>

          <Link to="/menu" className={`mobile-nav-item ${isActive("/menu") ? "active" : ""}`}>
            <BookOpen className="mobile-nav-icon" size={20} />
            <span className="mobile-nav-label">Menu</span>
          </Link>

          {user && (
            <Link to="/orders" className={`mobile-nav-item ${isActive("/orders") ? "active" : ""}`}>
              <Package className="mobile-nav-icon" size={20} />
              <span className="mobile-nav-label">Orders</span>
            </Link>
          )}

          <Link to="/cart" className={`mobile-nav-item ${isActive("/cart") ? "active" : ""}`}>
            <div className="mobile-cart-icon-wrapper">
              <ShoppingCart className="mobile-nav-icon" size={20} />
              {cartCount > 0 && (
                <span className="mobile-cart-badge">{cartCount}</span>
              )}
            </div>
            <span className="mobile-nav-label">Cart</span>
          </Link>

          {!user && (
            <Link to="/login" className={`mobile-nav-item ${isActive("/login") ? "active" : ""}`}>
              <LogIn className="mobile-nav-icon" size={20} />
              <span className="mobile-nav-label">Login</span>
            </Link>
          )}
        </div>
      )}
    </>
  );
}

export default Navbar;
