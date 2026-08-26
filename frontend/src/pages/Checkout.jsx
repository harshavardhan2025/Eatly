import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import FoodLoader from "../components/FoodLoader";

function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState("Aditya University College");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);

  if (loading) {
    return (
      <main className="page narrow-page">
        <FoodLoader text="Placing your order with the kitchen..." />
      </main>
    );
  }

  if (cart.length === 0 && !placedOrder) {
    return (
      <main className="page narrow-page center">
        <h2>Your cart is empty</h2>
        <Link to="/menu" className="primary-button" style={{ marginTop: '16px', display: 'inline-block' }}>
          Browse Menu
        </Link>
      </main>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!user) {
      navigate("/login");
      return;
    }

    if (!address.trim()) {
      setError("Please provide a delivery address.");
      return;
    }

    setLoading(true);
    try {
      const orderPayload = {
        address: address.trim(),
        items: cart.map(item => ({
          food_item_id: item.food_item_id,
          quantity: item.quantity
        }))
      };

      const res = await api.placeOrder(orderPayload);
      clearCart();
      setPlacedOrder(res);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Order Confirmation View
  if (placedOrder) {
    return (
      <main className="page narrow-page">
        <div className="order-details official-card text-center">
          <div className="success-icon-badge">✅</div>
          <h1 className="success-title">ORDER PLACED SUCCESSFULLY!</h1>
          <span className="order-id-tag">ORDER #{placedOrder.id}</span>

          <p className="success-subtext">
            Your order has been received by our kitchen staff and is being processed.
          </p>

          <div className="official-info-box">
            <div className="info-grid">
              <div>
                <span className="info-label">Total Paid:</span>
                <strong className="grand-total">₹{placedOrder.total_amount}</strong>
              </div>
              <div>
                <span className="info-label">Order Status:</span>
                <span className="status-badge-pill status-placed">● PLACED</span>
              </div>
            </div>
          </div>

          <div className="order-actions-bar">
            <Link to={`/orders/${placedOrder.id}`} className="primary-button">
              View Order Status & Tracking ➔
            </Link>
            <Link to="/menu" className="secondary-button">
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page narrow-page">
      <div className="page-heading">
        <p>CHECKOUT & CONFIRMATION</p>
        <h1>Confirm Your Order</h1>
      </div>

      {error && (
        <div className="error-banner-box">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form className="checkout-card official-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="deliveryAddress">Delivery Address</label>
          <textarea
            id="deliveryAddress"
            placeholder="Enter your complete delivery address, house number, street, city and pin code"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="official-table-wrapper">
          <h3>Order Items Summary</h3>
          <table className="official-order-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.food_item_id}>
                  <td>{item.name}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">₹{item.price * item.quantity}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2" className="text-right font-bold">Grand Total:</td>
                <td className="text-right grand-total">₹{cartTotal}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <button type="submit" disabled={loading} className="primary-button full checkout-btn">
          {loading ? "🍲 Placing Order..." : "Confirm & Place Order ➔"}
        </button>
      </form>
    </main>
  );
}

export default Checkout;
