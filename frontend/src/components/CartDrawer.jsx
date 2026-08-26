import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, MapPin, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const CartDrawer = ({ onOrderPlaced, onOpenAuth }) => {
  const { cart, cartTotal, isCartOpen, closeCart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();

  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isCartOpen) return null;

  const deliveryFee = cartTotal > 500 || cartTotal === 0 ? 0 : 30;
  const taxes = Math.round(cartTotal * 0.05);
  const grandTotal = cartTotal + deliveryFee + taxes;

  const handleCheckout = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      closeCart();
      onOpenAuth();
      return;
    }

    if (!address.trim() || address.trim().length < 5) {
      setError('Please provide a complete delivery address (at least 5 characters)');
      return;
    }

    if (cart.length === 0) {
      setError('Your cart is empty');
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

      const placedOrder = await api.placeOrder(orderPayload);
      clearCart();
      closeCart();
      if (onOrderPlaced) onOrderPlaced(placedOrder);
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md glass-panel rounded-none border-y-0 border-r-0 bg-neutral-950/95 flex flex-col justify-between animate-slide-in">
          
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-heading">Your Feast Cart</h2>
                <p className="text-xs text-gray-400">{cart.length} item(s) selected</p>
              </div>
            </div>
            <button 
              onClick={closeCart}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-12">
                <ShoppingBag className="w-16 h-16 text-neutral-800 mb-4 stroke-1" />
                <p className="text-base font-semibold text-gray-300 mb-1">Your cart is hungry!</p>
                <p className="text-xs text-gray-500 max-w-xs">Explore our royal biryanis and starters to add your favorite dishes.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.food_item_id}
                  className="glass-panel p-3.5 flex items-center gap-3 border border-white/5 hover:border-amber-500/20 transition-all"
                >
                  <img 
                    src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80"} 
                    alt={item.name} 
                    className="w-16 h-16 rounded-xl object-cover bg-neutral-900"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                    <p className="text-xs text-amber-400 font-bold mt-0.5">₹{item.price * item.quantity}</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(item.food_item_id, item.quantity - 1)}
                      className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-white px-1.5">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.food_item_id, item.quantity + 1)}
                      className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.food_item_id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Delivery & Checkout Footer */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-white/10 bg-black/40 space-y-4">
              
              {/* Error Banner */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Delivery Address Input */}
              <div>
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Delivery Address</span>
                </label>
                <input
                  type="text"
                  placeholder="Street, Building, Flat / Door No, Landmark..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Bill Breakdown */}
              <div className="space-y-1.5 text-xs text-gray-300 border-t border-b border-white/10 py-3">
                <div className="flex justify-between">
                  <span>Item Subtotal</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST & Taxes (5%)</span>
                  <span>₹{taxes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? "text-emerald-400 font-semibold" : ""}>
                    {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-white/5">
                  <span>To Pay</span>
                  <span className="text-amber-400 font-sans">₹{grandTotal}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full btn-primary justify-center py-3 text-sm tracking-wide uppercase font-bold shadow-xl shadow-amber-500/20"
              >
                {loading ? (
                  <span>PLINKING ORDER...</span>
                ) : !user ? (
                  <span>SIGN IN TO PLACE ORDER</span>
                ) : (
                  <>
                    <span>CONFIRM & PLACE ORDER</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
