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
  Users,
  ChefHat
} from "lucide-react";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [mobileSearch, setMobileSearch] = useState("");

  const handleMobileSearch = (e) => {
    setMobileSearch(e.target.value);
    window.dispatchEvent(new CustomEvent("mobile-menu-search", { detail: e.target.value }));
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;
  const isAdminMode = isAdmin || user?.role === "admin" || location.pathname.startsWith("/admin");

  return (
    <>
      <nav className={`navbar ${isAdminMode ? 'admin-navbar' : ''}`}>
        <div className="navbar-container">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link to={isAdminMode ? "/admin" : "/"} className="logo" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UtensilsCrossed className="logo-icon" size={24} color="#f59e0b" />
                <span className="logo-text" style={{ color: '#ffffff' }}>Eatly</span>
              </div>
              
              {isAdminMode && (
                <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '15px' }}>
                  <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '800', letterSpacing: '1px', lineHeight: '1' }}>RESTAURANT ADMIN</span>
                  <span style={{ fontSize: '18px', color: '#ffffff', fontWeight: '800', lineHeight: '1.2' }}>Dashboard</span>
                </div>
              )}
            </Link>
          </div>

          {location.pathname === "/menu" && !isAdminMode && (
            <div className="mobile-header-search">
              <input
                type="text"
                placeholder="Search menu..."
                value={mobileSearch}
                onChange={handleMobileSearch}
                style={{ width: '100%', maxWidth: '200px', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Nav Links (Desktop + Mobile Dropdown) */}
            <div className={`nav-links ${mobileOpen ? "mobile-active" : ""}`}>
              {isAdminMode ? (
                <>
                  <div className="user-menu">
                    <span className="user-badge" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={16} /> {user?.name || 'Admin'}
                    </span>
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

                  <Link to="/cart" className="cart-nav-btn" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShoppingCart size={18} />
                    <span>Cart</span>
                    {cartCount > 0 && (
                      <span className="cart-count-badge">{cartCount}</span>
                    )}
                  </Link>

                  {/* MOBILE ONLY AUTH BUTTONS */}
                  <div className="mobile-only-auth" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    {user ? (
                      <button onClick={handleLogout} className="nav-logout-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%' }}>
                        <LogOut size={16} /> Logout
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Link to="/login" className="login-link" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <LogIn size={18} /> Login
                        </Link>
                        <Link to="/register" className="register-btn" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <UserPlus size={18} /> Register
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {isAdminMode ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button onClick={handleLogout} className="nav-logout-btn desktop-auth" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#d97706', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  <LogOut size={16} /> Logout
                </button>
                <button
                  className="admin-navbar-hamburger"
                  style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer' }}
                  onClick={() => window.dispatchEvent(new CustomEvent('toggle-admin-sidebar'))}
                  aria-label="Toggle Admin Sidebar"
                >
                  <MenuIcon size={24} />
                </button>
              </div>
            ) : (
              <>
                {user ? (
                  <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span className="user-badge" style={{ display: 'none' }}></span>
                    <button onClick={handleLogout} className="nav-logout-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                ) : (
                  <div className="auth-btns desktop-auth">
                    <Link to="/login" className="login-link" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <LogIn size={18} /> Login
                    </Link>
                    <Link to="/register" className="register-btn" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserPlus size={18} /> Register
                    </Link>
                  </div>
                )}
                <button
                  className="mobile-hamburger"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-label="Toggle Navigation Menu"
                >
                  {mobileOpen ? <X size={24} /> : <MenuIcon size={24} />}
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Fixed Bottom App Bar */}
      {isAdminMode ? (
        <div className="mobile-bottom-nav admin-mobile-bottom-nav">
          <Link to="/admin?tab=active_orders" className={`mobile-nav-item ${isActive("/admin") && (!location.search || location.search.includes("tab=active_orders")) ? "active" : ""}`}>
            <Package className="mobile-nav-icon" size={20} />
            <span className="mobile-nav-label">Orders</span>
          </Link>

          <Link to="/admin?tab=accepted_orders" className={`mobile-nav-item ${location.search.includes("tab=accepted_orders") ? "active" : ""}`}>
            <ChefHat className="mobile-nav-icon" size={20} />
            <span className="mobile-nav-label">Accepted</span>
          </Link>

          <Link to="/admin?tab=menu" className={`mobile-nav-item ${location.search.includes("tab=menu") ? "active" : ""}`}>
            <BookOpen className="mobile-nav-icon" size={20} />
            <span className="mobile-nav-label">Menu</span>
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
