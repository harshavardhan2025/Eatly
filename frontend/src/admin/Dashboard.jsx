import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";

function Dashboard() {
  const { logout, user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Auth guard — redirect non-admins immediately
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/login", { replace: true });
    }
  }, [user, isAdmin, loading, navigate]);

  const tabQuery = searchParams.get("tab");

  // Navigation tab state: "orders" | "menu" | "complaints" | "users"
  const [activeTab, setActiveTab] = useState(
    tabQuery && ["orders", "menu", "complaints", "users"].includes(tabQuery) ? tabQuery : "orders"
  );

  useEffect(() => {
    if (tabQuery && ["orders", "menu", "complaints", "users"].includes(tabQuery)) {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);

  const handleTabSwitch = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
  };

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Menu State & Sub-Filter
  const [foods, setFoods] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuAvailFilter, setMenuAvailFilter] = useState("all"); // "all" | "available" | "unavailable"

  // Modal & Category State
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [menuFormData, setMenuFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Biryani",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
    available: true,
    is_veg: true,
  });

  // Complaints State
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);

  // Users State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // 1. Fetch Orders
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await api.getAdminOrders();
      setOrders(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  };

  // 2. Fetch Menu
  const fetchMenu = async () => {
    setMenuLoading(true);
    try {
      const data = await api.getFoodItems();
      setFoods(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setMenuLoading(false);
    }
  };

  // 3. Fetch Complaints
  const fetchComplaints = async () => {
    setComplaintsLoading(true);
    try {
      const data = await api.getAdminComplaints();
      setComplaints(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setComplaintsLoading(false);
    }
  };

  // 4. Fetch Users
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await api.getAdminUsers();
      setUsers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchMenu();
    fetchComplaints();
    fetchUsers();
  }, []);

  // Handlers for Orders
  const handleOrderStatus = async (id, newStatus) => {
    try {
      await api.updateOrderStatus(id, newStatus);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.detail || err.message || "Failed to update order status.");
    }
  };

  // Handlers for Menu
  const handleOpenAddFood = () => {
    setEditingId(null);
    setIsCustomCategory(false);
    setCustomCategoryInput("");
    setMenuFormData({
      name: "",
      description: "",
      price: "",
      category: "Biryani",
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
      available: true,
      is_veg: true,
    });
    setShowMenuModal(true);
  };

  const handleOpenEditFood = (food) => {
    setEditingId(food.id);
    setIsCustomCategory(false);
    setCustomCategoryInput("");
    setMenuFormData({
      name: food.name,
      description: food.description || "",
      price: food.price.toString(),
      category: food.category || "Biryani",
      image: food.image_url || food.image || "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
      available: food.is_available !== false,
      is_veg: food.is_veg !== false,
    });
    setShowMenuModal(true);
  };

  const toggleAvailability = async (food) => {
    try {
      await api.updateFoodItem(food.id, { is_available: !(food.is_available !== false) });
      fetchMenu();
    } catch (err) {
      alert(err.response?.data?.detail || err.message || "Failed to update availability.");
    }
  };

  const handleDeleteFood = async (id) => {
    if (window.confirm("Are you sure you want to delete this food item?")) {
      try {
        await api.deleteFoodItem(id);
        fetchMenu();
      } catch (err) {
        alert(err.response?.data?.detail || err.message || "Failed to delete item.");
      }
    }
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMenuFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveFood = async (e) => {
    e.preventDefault();
    if (!menuFormData.name || !menuFormData.price) {
      alert("Please fill in Name and Price.");
      return;
    }

    const finalCategory = isCustomCategory
      ? customCategoryInput.trim() || "General"
      : menuFormData.category;

    try {
      const payload = {
        name: menuFormData.name.trim(),
        description: menuFormData.description.trim(),
        price: parseFloat(menuFormData.price),
        category: finalCategory,
        image_url: menuFormData.image,
        is_available: menuFormData.available,
        is_veg: menuFormData.is_veg,
      };

      if (editingId) {
        await api.updateFoodItem(editingId, payload);
      } else {
        await api.createFoodItem(payload);
      }

      setShowMenuModal(false);
      fetchMenu();
    } catch (err) {
      alert(err.response?.data?.detail || err.message || "Failed to save food item.");
    }
  };

  // Handlers for Complaints
  const handleResolveComplaint = async (id) => {
    try {
      await api.resolveComplaint(id);
      fetchComplaints();
    } catch (err) {
      alert("Failed to resolve complaint.");
    }
  };

  // Handlers for Users
  const handleToggleBlock = async (user) => {
    const isBlocked = user.role === "blocked";
    const action = isBlocked ? "unblock" : "block";
    if (window.confirm(`Are you sure you want to ${action} "${user.name}"?`)) {
      try {
        await api.updateAdminUser(user.id, {
          name: user.name,
          role: isBlocked ? "customer" : "blocked",
        });
        fetchUsers();
      } catch (err) {
        alert(err.message || `Failed to ${action} user`);
      }
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Delete customer "${user.name}" (${user.phone})? This cannot be undone.`)) {
      try {
        await api.deleteAdminUser(user.id);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.detail || err.message || "Failed to delete user");
      }
    }
  };

  // Unique categories list dynamically extracted from existing food items + defaults
  const existingCategories = Array.from(
    new Set(["Biryani", "Starters", "Main Course", "Beverages", ...foods.map((f) => f.category).filter(Boolean)])
  );

  // Filtered Food List by Availability Sub-Tab
  const filteredFoods = foods.filter((f) => {
    if (menuAvailFilter === "available") return f.is_available !== false;
    if (menuAvailFilter === "unavailable") return f.is_available === false;
    return true;
  });

  // Filtered Orders
  const newOrders = orders.filter((o) => o.status === "PLACED" || o.status === "NEW");
  const inProgressOrders = orders.filter((o) => o.status === "ACCEPTED" || o.status === "PREPARING");

  return (
    <main className="admin-page">

      {/* Admin Dashboard Header */}
      <div className="admin-header">
        <div>
          <p className="admin-badge">RESTAURANT ADMIN DASHBOARD</p>
          <h1>Control Panel</h1>
        </div>
      </div>

      {/* Admin Navigation Tabs (Only: Order Accepting, Menu Management, Complaints) */}
      <div className="admin-tabs-bar">
        <button
          className={`admin-tab ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => handleTabSwitch("orders")}
        >
          📋 Order Queue ({newOrders.length} New)
        </button>

        <button
          className={`admin-tab ${activeTab === "menu" ? "active" : ""}`}
          onClick={() => handleTabSwitch("menu")}
        >
          🍽️ Menu Management ({foods.length} Items)
        </button>

        <button
          className={`admin-tab ${activeTab === "complaints" ? "active" : ""}`}
          onClick={() => handleTabSwitch("complaints")}
        >
          💬 Complaints ({complaints.filter(c => c.status === "OPEN").length} Open)
        </button>

        <button
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => handleTabSwitch("users")}
        >
          👥 Customers ({users.filter(u => u.role !== "admin").length} Total)
        </button>
      </div>

      {/* TAB 1: ORDER ACCEPTING & QUEUE */}
      {activeTab === "orders" && (
        <div className="admin-section">
          {/* New Orders Queue */}
          <div className="admin-orders-box">
            <h2 className="admin-section-title">🚨 Incoming New Orders ({newOrders.length})</h2>

            {ordersLoading ? (
              <p>Loading active orders queue...</p>
            ) : newOrders.length === 0 ? (
              <div className="admin-empty-state">
                <span>✨</span>
                <p>No new incoming orders at the moment.</p>
              </div>
            ) : (
              newOrders.map((order) => (
                <div className="admin-order-card highlight" key={order.id}>
                  <div className="admin-order-top">
                    <div>
                      <h3>Order #{order.id.slice(-6).toUpperCase()}</h3>
                      <span className="order-time">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span className="status-badge new-badge">NEW ORDER</span>
                  </div>

                  <div className="customer-info-box">
                    <p><strong>Customer:</strong> {order.customer_name}</p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      <a href={`tel:+91${order.customer_phone}`} className="phone-link">📞 {order.customer_phone}</a>
                      {" | "}
                      <a href={`https://wa.me/91${order.customer_phone}`} target="_blank" rel="noreferrer" className="wa-link" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#25D366" viewBox="0 0 16 16" style={{ marginRight: '6px' }}>
                          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                        </svg>
                        WhatsApp
                      </a>
                    </p>
                    <p><strong>Delivery Address:</strong> {order.address}</p>
                  </div>

                  <div className="order-items-summary">
                    <p><strong>Ordered Items:</strong></p>
                    <ul>
                      {order.items?.map((it, idx) => (
                        <li key={idx}>{it.name} × {it.quantity} (₹{it.subtotal || it.price * it.quantity})</li>
                      ))}
                    </ul>
                    <div className="total-bar">
                      <span>Total Amount:</span>
                      <strong>₹{order.total_amount}</strong>
                    </div>
                  </div>

                  {/* Accept / Reject Buttons */}
                  <div className="admin-action-buttons">
                    <button
                      className="btn-accept"
                      onClick={() => handleOrderStatus(order.id, "ACCEPTED")}
                    >
                      ✓ Accept Order
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleOrderStatus(order.id, "REJECTED")}
                    >
                      ✕ Reject Order
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Orders in Preparation */}
          {inProgressOrders.length > 0 && (
            <div className="admin-orders-box" style={{ marginTop: "30px" }}>
              <h2 className="admin-section-title">👨‍🍳 Kitchen Preparing ({inProgressOrders.length})</h2>
              {inProgressOrders.map((order) => (
                <div className="admin-order-card" key={order.id}>
                  <div className="admin-order-top">
                    <h3>Order #{order.id.slice(-6).toUpperCase()}</h3>
                    <span className="status-badge preparing-badge">{order.status}</span>
                  </div>
                  <p><strong>Customer:</strong> {order.customer_name} (<a href={`tel:${order.customer_phone}`} style={{ textDecoration: 'none', color: '#007bff' }}>📞 {order.customer_phone}</a>)</p>
                  <p><strong>Items:</strong> {order.items?.map(it => `${it.name} x${it.quantity}`).join(", ")}</p>
                  <div className="admin-action-buttons">
                    <button className="btn-status" onClick={() => handleOrderStatus(order.id, "DELIVERED")}>
                      🚴 Mark Out for Delivery / Delivered
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MENU MANAGEMENT */}
      {activeTab === "menu" && (
        <div className="admin-section">
          <div className="admin-section-header">
            <div>
              <h2>🍽️ Food Menu Management</h2>
            </div>
            <button className="btn-add-food" onClick={handleOpenAddFood}>
              + Add New Dish
            </button>
          </div>

          {/* Availability Sub-Filter Pills */}
          <div className="admin-sub-filter-bar">
            <button
              className={`sub-filter-pill ${menuAvailFilter === "all" ? "active" : ""}`}
              onClick={() => setMenuAvailFilter("all")}
            >
              All Dishes ({foods.length})
            </button>
            <button
              className={`sub-filter-pill ${menuAvailFilter === "available" ? "active" : ""}`}
              onClick={() => setMenuAvailFilter("available")}
            >
              ✓ Available Only ({foods.filter((f) => f.is_available !== false).length})
            </button>
            <button
              className={`sub-filter-pill ${menuAvailFilter === "unavailable" ? "active" : ""}`}
              onClick={() => setMenuAvailFilter("unavailable")}
            >
              ✕ Disabled / Unavailable ({foods.filter((f) => f.is_available === false).length})
            </button>
          </div>

          {menuLoading ? (
            <p>Loading food menu items...</p>
          ) : filteredFoods.length === 0 ? (
            <div className="admin-empty-state">
              <span>🍽️</span>
              <p>No dishes found for this filter tab.</p>
            </div>
          ) : (
            <div className="admin-menu-grid">
              {filteredFoods.map((food) => (
                <div className="admin-dish-card" key={food.id}>
                  <img src={food.image_url || food.image} alt={food.name} />

                  <div className="dish-details">
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                      <span className="dish-cat">{food.category || "Biryani"}</span>
                      <span style={{ fontSize: "12px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px", color: food.is_veg !== false ? "#16a34a" : "#dc2626" }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '14px', height: '14px', border: `1.5px solid ${food.is_veg !== false ? '#16a34a' : '#dc2626'}`, borderRadius: '2px'
                        }} title={food.is_veg !== false ? "Vegetarian" : "Non-Vegetarian"}>
                          <div style={{
                            width: '6px', height: '6px', borderRadius: '50%', backgroundColor: food.is_veg !== false ? '#16a34a' : '#dc2626'
                          }}></div>
                        </div>
                        {food.is_veg !== false ? "Veg" : "Non-Veg"}
                      </span>
                    </div>
                    <h3>{food.name}</h3>
                    <p className="dish-desc">{food.description}</p>
                    <strong className="dish-price">₹{food.price}</strong>
                  </div>

                  <div className="dish-status-bar">
                    <span className={food.is_available !== false ? "tag-avail" : "tag-unavail"}>
                      {food.is_available !== false ? "✓ Available" : "✕ Disabled"}
                    </span>
                  </div>

                  <div className="dish-card-actions">
                    <button
                      className="btn-toggle"
                      onClick={() => toggleAvailability(food)}
                    >
                      {food.is_available !== false ? "Disable" : "Enable"}
                    </button>

                    <button
                      className="btn-edit"
                      onClick={() => handleOpenEditFood(food)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteFood(food.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPLAINTS */}
      {activeTab === "complaints" && (
        <div className="admin-section">
          <h2 className="admin-section-title">💬 Customer Complaints & Support Queue</h2>

          {complaintsLoading ? (
            <p>Loading customer complaints...</p>
          ) : complaints.length === 0 ? (
            <div className="admin-empty-state">
              <span>🎉</span>
              <p>No customer complaints reported! Everything is running smoothly.</p>
            </div>
          ) : (
            <div className="admin-complaints-list">
              {complaints.map((c) => (
                <div className={`complaint-card ${c.status === "OPEN" ? "open-issue" : "resolved-issue"}`} key={c.id}>
                  <div className="complaint-top">
                    <div>
                      <h3>Customer: {c.customer_name}</h3>
                      <p className="complaint-phone">📞 {c.customer_phone || "Not provided"}</p>
                    </div>
                    <span className={`status-badge ${c.status === "OPEN" ? "open-badge" : "resolved-badge"}`}>
                      {c.status}
                    </span>
                  </div>

                  <p className="complaint-text">"{c.issue}"</p>

                  {c.status === "OPEN" && (
                    <button
                      className="btn-resolve"
                      onClick={() => handleResolveComplaint(c.id)}
                    >
                      ✓ Mark Complaint Resolved
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: USERS / CUSTOMERS */}
      {activeTab === "users" && (
        <div className="admin-section">
          <div className="admin-section-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '15px' }}>
            <div>
              <h2>👥 Customer Management</h2>
            </div>
            <div className="search-bar-container" style={{ position: 'relative', flex: '1', maxWidth: '350px' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                 <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                   <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                 </svg>
              </span>
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  borderRadius: '24px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  outline: 'none',
                  fontSize: '14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#d97706';
                  e.target.style.boxShadow = '0 0 0 3px rgba(217, 119, 6, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                }}
              />
            </div>
          </div>

          {usersLoading ? (
            <p>Loading customers...</p>
          ) : users.filter(u => u.role !== 'admin').length === 0 ? (
             <div className="admin-empty-state">
               <span>👥</span>
               <p>No customers registered yet.</p>
             </div>
          ) : (
            <div className="admin-menu-grid">
              {users
                .filter(u => u.role !== 'admin')
                .filter(u => {
                  if (!userSearchTerm) return true;
                  const term = userSearchTerm.toLowerCase();
                  return (u.name && u.name.toLowerCase().includes(term)) || 
                         (u.phone && u.phone.includes(term));
                })
                .map(user => {
                  const isBlocked = user.role === 'blocked';
                  return (
                    <div key={user.id} className="admin-dish-card">
                      <div className="dish-details" style={{marginTop: '15px'}}>
                        <span className={`dish-cat ${isBlocked ? 'tag-unavail' : 'tag-avail'}`} style={{display: 'inline-block', marginBottom: '10px', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold'}}>
                          {isBlocked ? 'Blocked' : 'Active'}
                        </span>
                        <h3>{user.name}</h3>
                        <p className="dish-desc">📞 {user.phone}</p>
                      </div>
                      
                      <div className="dish-card-actions" style={{marginTop: '20px'}}>
                        <button
                          className="btn-toggle"
                          onClick={() => handleToggleBlock(user)}
                        >
                          {isBlocked ? "Unblock" : "Block"}
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteUser(user)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Food Modal with Custom Category Support */}
      {showMenuModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>{editingId ? "✏️ Edit Dish Details" : "✨ Add New Dish"}</h2>

            <form onSubmit={handleSaveFood} className="admin-dish-form">
              <div className="form-group">
                <label htmlFor="dishName">Dish Name</label>
                <input
                  id="dishName"
                  type="text"
                  required
                  placeholder="e.g. Royal Hyderabadi Chicken Biryani"
                  value={menuFormData.name}
                  onChange={(e) => setMenuFormData({ ...menuFormData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="dishCat">Category</label>
                <select
                  id="dishCat"
                  value={isCustomCategory ? "NEW_CUSTOM" : menuFormData.category}
                  onChange={(e) => {
                    if (e.target.value === "NEW_CUSTOM") {
                      setIsCustomCategory(true);
                    } else {
                      setIsCustomCategory(false);
                      setMenuFormData({ ...menuFormData, category: e.target.value });
                    }
                  }}
                  className="select-input"
                >
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="NEW_CUSTOM">✨ + Add New Custom Category...</option>
                </select>
              </div>

              {/* Dynamic New Custom Category Input Field */}
              {isCustomCategory && (
                <div className="form-group">
                  <label htmlFor="customCatInput" style={{ color: "#d97706", fontWeight: "700" }}>
                    Type New Custom Category Name:
                  </label>
                  <input
                    id="customCatInput"
                    type="text"
                    required
                    placeholder="e.g. Chef Specials, Desserts, Soups..."
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="dishDesc">Description</label>
                <textarea
                  id="dishDesc"
                  rows={3}
                  placeholder="Aromatic spices, basmati rice, tender chicken..."
                  value={menuFormData.description}
                  onChange={(e) => setMenuFormData({ ...menuFormData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="dishPrice">Price (₹)</label>
                <input
                  id="dishPrice"
                  type="number"
                  step="1"
                  required
                  placeholder="280"
                  value={menuFormData.price}
                  onChange={(e) => setMenuFormData({ ...menuFormData, price: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Dish Image Selection</label>
                <div className="image-source-box">
                  <div className="file-upload-block">
                    <label htmlFor="dishFileInput" className="file-upload-btn">
                      📁 Select Image File from Device / Folder
                    </label>
                    <input
                      id="dishFileInput"
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      style={{ display: "none" }}
                    />
                  </div>

                  <span className="or-divider">— OR enter Web Image URL —</span>

                  <input
                    id="dishImg"
                    type="text"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={menuFormData.image}
                    onChange={(e) => setMenuFormData({ ...menuFormData, image: e.target.value })}
                  />
                </div>
              </div>

              {/* Image Preview Box */}
              {menuFormData.image && (
                <div className="dish-img-preview-box">
                  <span>Preview:</span>
                  <img src={menuFormData.image} alt="Dish Preview" />
                </div>
              )}

              {/* Dietary Type Radio Buttons */}
              <div className="form-group">
                <label>Dietary Type</label>
                <div style={{ display: "flex", gap: "20px", marginTop: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "600" }}>
                    <input
                      type="radio"
                      name="dietTypeDashboard"
                      checked={menuFormData.is_veg === true}
                      onChange={() => setMenuFormData({ ...menuFormData, is_veg: true })}
                      style={{ cursor: "pointer", width: "18px", height: "18px", accentColor: "#16a34a" }}
                    />
                    Vegetarian 🌿
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "600" }}>
                    <input
                      type="radio"
                      name="dietTypeDashboard"
                      checked={menuFormData.is_veg === false}
                      onChange={() => setMenuFormData({ ...menuFormData, is_veg: false })}
                      style={{ cursor: "pointer", width: "18px", height: "18px", accentColor: "#dc2626" }}
                    />
                    Non-Vegetarian 🍗
                  </label>
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label htmlFor="availCheckModal" className="checkbox-label">
                  <input
                    type="checkbox"
                    id="availCheckModal"
                    checked={menuFormData.available}
                    onChange={(e) => setMenuFormData({ ...menuFormData, available: e.target.checked })}
                  />
                  <span>Available for Ordering [ ✓ ]</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="submit" className="primary-button">
                  Save Dish
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowMenuModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}

export default Dashboard;
