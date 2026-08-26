import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Cart() {
  const { cart, cartTotal, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  return (
    <main className="page cart-page">
      <div style={{ maxWidth: '700px', width: '100%', margin: '0 auto' }}>
        <div className="page-heading">
          <p>YOUR SHOPPING CART</p>
          <h1>Order Summary</h1>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty-card official-card text-center">
            <div className="empty-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add delicious dishes from our menu to start your order.</p>
            <Link to="/menu" className="primary-button">
              Browse Our Menu
            </Link>
          </div>
        ) : (
          <div className="cart-card official-card">
            <div className="cart-items-list">
              {cart.map((item) => (
                <div className="cart-item-row" key={item.food_item_id}>
                  <div className="cart-item-info">
                    <h3>{item.name}</h3>
                    <span className="cart-unit-price">₹{item.price} per item</span>
                  </div>

                  <div className="cart-qty-controller">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.food_item_id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="qty-val">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.food_item_id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-item-right">
                    <strong className="cart-item-total">₹{item.price * item.quantity}</strong>
                    <button
                      className="remove-item-btn"
                      onClick={() => removeFromCart(item.food_item_id)}
                      title="Remove Item"
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary-footer">
              <div className="cart-total-row">
                <span>Total Bill Amount:</span>
                <strong className="cart-grand-total">₹{cartTotal}</strong>
              </div>

              <button onClick={() => navigate("/checkout")} className="primary-button full checkout-btn">
                Proceed to Checkout ➔
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default Cart;
