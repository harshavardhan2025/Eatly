import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import FoodLoader from "../components/FoodLoader";

function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data || null);
      } catch (e) {
        console.error(e);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return <main className="page narrow-page"><FoodLoader text="⏳ 🧾 Fetching order details..." /></main>;
  }

  if (!order) {
    return (
      <main className="page narrow-page center">
        <h2>Order Not Found</h2>
        <Link to="/orders" className="primary-button" style={{ marginTop: '16px', display: 'inline-block' }}>
          Back to My Orders
        </Link>
      </main>
    );
  }

  const STATUS_STAGES = [
    { key: "PLACED", label: "Order Placed", desc: "Your order has been received." },
    { key: "ACCEPTED", label: "Accepted", desc: "The restaurant accepted your order." },
    { key: "PREPARING", label: "Preparing", desc: "Your food is being prepared." },
    { key: "READY", label: "Ready", desc: "Food is ready for delivery." },
    { key: "DELIVERED", label: "Delivered", desc: "Order delivered safely." }
  ];

  const getStageState = (stageKey) => {
    const statusOrder = ["PLACED", "ACCEPTED", "PREPARING", "READY", "DELIVERED"];
    const currentIdx = statusOrder.indexOf(order.status);
    const stageIdx = statusOrder.indexOf(stageKey);

    if (currentIdx === -1) return "pending";
    if (stageIdx < currentIdx) return "done";
    if (stageIdx === currentIdx) return "current";
    return "pending";
  };

  return (
    <main className="page narrow-page">
      <div className="page-heading">
        <p>OFFICIAL RECEIPT & STATUS</p>
        <h1>Order Summary</h1>
      </div>

      <div className="order-details official-card">
        {/* Header Summary */}
        <div className="order-card-header-bar">
          <div>
            <span className="order-id-tag">ORDER #{order.id}</span>
            <p className="order-date-text">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          <span className={`status-badge-pill status-${order.status.toLowerCase()}`}>
            ● {order.status}
          </span>
        </div>

        {/* Customer Information Block */}
        <div className="official-info-box">
          <h3>Customer & Delivery Details</h3>
          <div className="info-grid">
            <div>
              <span className="info-label">Customer Name:</span>
              <strong className="info-val">{order.customer_name || "Guest"}</strong>
            </div>
            <div>
              <span className="info-label">Contact Phone:</span>
              <a href={`tel:+91${order.customer_phone}`} className="info-phone-link">
                📞 {order.customer_phone}
              </a>
            </div>
            <div className="info-full">
              <span className="info-label">Delivery Address:</span>
              <p className="info-val">{order.address}</p>
            </div>
          </div>
        </div>

        {/* Itemized Order Table */}
        <div className="official-table-wrapper">
          <h3>Ordered Items Summary</h3>
          <table className="official-order-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((it, idx) => (
                <tr key={idx}>
                  <td className="item-name">{it.name}</td>
                  <td className="text-center">{it.quantity}</td>
                  <td className="text-right">₹{it.price}</td>
                  <td className="text-right font-bold">₹{it.subtotal || (it.price * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="text-right font-bold">Total Bill Amount:</td>
                <td className="text-right grand-total">₹{order.total_amount}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Live Tracking Progress Stepper */}
        <div className="official-stepper-box">
          <h3>Order Status Timeline</h3>
          <div className="stepper-track">
            {STATUS_STAGES.map((stage) => {
              const state = getStageState(stage.key);
              return (
                <div key={stage.key} className={`stepper-step ${state}`}>
                  <div className="stepper-node">
                    {state === "done" ? "✓" : state === "current" ? "●" : "○"}
                  </div>
                  <div className="stepper-info">
                    <strong className="stepper-title">{stage.label}</strong>
                    {state !== "pending" && <p className="stepper-desc">{stage.desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="order-actions-bar">
          <Link to="/orders" className="secondary-button">
            ← Back to Orders
          </Link>
          <Link to="/menu" className="primary-button">
            Explore Menu
          </Link>
        </div>
      </div>
    </main>
  );
}

export default OrderDetails;
