import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import FoodLoader from "../components/FoodLoader";

function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.getCustomerOrders();
        setOrders(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [complaintText, setComplaintText] = useState("");
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);

  const handleOpenComplaint = (order) => {
    setSelectedOrder(order);
    setComplaintText("");
    setShowComplaintModal(true);
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintText.trim()) return;
    setComplaintSubmitting(true);
    try {
      await api.submitComplaint({
        customer_name: user?.name || selectedOrder?.customer_name || "Customer",
        customer_phone: user?.phone || selectedOrder?.customer_phone || "",
        issue: `Order #${selectedOrder?.id?.slice(-6).toUpperCase()}: ${complaintText.trim()}`,
      });
      alert("Complaint submitted successfully! Our admin team will inspect it.");
      setShowComplaintModal(false);
      setComplaintText("");
    } catch (err) {
      alert("Failed to submit complaint.");
    } finally {
      setComplaintSubmitting(false);
    }
  };

  return (
    <main className="page">

      <div className="page-heading">
        <p>YOUR ORDERS</p>
        <h1>Order History</h1>
      </div>

      {loading ? (
        <FoodLoader text="⏳ 📦 Fetching your orders..." />
      ) : orders.length === 0 ? (
        <div className="cart-empty-card official-card text-center">
          <div className="empty-icon">📦</div>
          <h2>No orders placed yet</h2>
          <p>Explore our menu and place your first delicious food order.</p>
          <Link to="/menu" className="primary-button">
            Order Food Now
          </Link>
        </div>
      ) : (
        <div className="orders-list-grid">
          {orders.map((order) => (
            <div className="order-history-card official-card" key={order.id}>
              <div className="order-history-header">
                <div>
                  <span className="order-id-tag">ORDER #{order.id?.slice(-6).toUpperCase()}</span>
                  <p className="order-date-text">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>

                <span className={`status-badge-pill status-${order.status.toLowerCase()}`}>
                  ● {order.status}
                </span>
              </div>

              <div className="order-history-body">
                <div className="order-history-items-summary">
                  <span className="info-label">Items Ordered:</span>
                  <p className="items-text">
                    {order.items?.map((it) => `${it.name} (${it.quantity})`).join(", ")}
                  </p>
                </div>

                <div className="order-history-total-box">
                  <span className="info-label">Total Bill:</span>
                  <strong className="grand-total">₹{order.total_amount}</strong>
                </div>
              </div>

              <div className="order-history-footer" style={{ display: "flex", gap: "10px" }}>
                <Link to={`/orders/${order.id}`} className="primary-button view-details-btn">
                  View Details & Tracking ➔
                </Link>
                <button
                  className="secondary-button"
                  onClick={() => handleOpenComplaint(order)}
                >
                  💬 Report Issue
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Complaint Modal */}
      {showComplaintModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>💬 Report Issue for Order #{selectedOrder?.id?.slice(-6).toUpperCase()}</h2>
            <form onSubmit={handleSubmitComplaint} className="admin-dish-form">
              <div className="form-group">
                <label>Describe your issue or feedback:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Food was delivered late, item missing, or quality concern..."
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="primary-button" disabled={complaintSubmitting}>
                  {complaintSubmitting ? "Submitting..." : "Submit Complaint"}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowComplaintModal(false)}
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

export default Orders;
