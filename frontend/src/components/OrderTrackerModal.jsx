import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle2, CookingPot, Bike, ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const OrderTrackerModal = ({ isOpen, onClose, newlyPlacedOrder }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomerOrders();
      setOrders(data);
      if (newlyPlacedOrder) {
        const found = data.find(o => o.id === newlyPlacedOrder.id) || newlyPlacedOrder;
        setSelectedOrder(found);
      } else if (data.length > 0) {
        setSelectedOrder(data[0]);
      }
    } catch (e) {
      if (newlyPlacedOrder) setSelectedOrder(newlyPlacedOrder);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen, newlyPlacedOrder]);

  if (!isOpen) return null;

  const STATUS_STEPS = [
    { key: 'PLACED', label: 'Placed', icon: ShoppingBag },
    { key: 'ACCEPTED', label: 'Accepted', icon: CheckCircle2 },
    { key: 'PREPARING', label: 'Cooking', icon: CookingPot },
    { key: 'READY', label: 'Out for Delivery', icon: Bike },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
  ];

  const getStepIndex = (status) => {
    const idx = STATUS_STEPS.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="modal-overlay">
      <div className="w-full max-w-3xl glass-panel p-6 border border-amber-500/30 shadow-2xl relative max-h-[90vh] flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-white">Live Order Tracking</h2>
              <p className="text-xs text-gray-400">Real-time update on your royal kitchen order</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              className="p-2 rounded-xl text-gray-400 hover:text-amber-400 hover:bg-white/5 transition-all"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pt-6 space-y-6">
          
          {selectedOrder ? (
            <div className="space-y-6">
              
              {/* Status Header */}
              <div className="glass-panel p-5 border-amber-500/20 bg-amber-500/5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">Order Reference</span>
                    <h3 className="text-lg font-bold text-white font-mono">{selectedOrder.id}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Placed on: {new Date(selectedOrder.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    Status: {selectedOrder.status}
                  </div>
                </div>

                {/* Stepper Bar */}
                <div className="pt-4 border-t border-white/10">
                  <div className="relative flex items-center justify-between">
                    {/* Connecting Line */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-white/10 z-0" />
                    <div 
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-amber-500 to-emerald-400 z-0 transition-all duration-500"
                      style={{ width: `${(getStepIndex(selectedOrder.status) / (STATUS_STEPS.length - 1)) * 100}%` }}
                    />

                    {/* Nodes */}
                    {STATUS_STEPS.map((step, idx) => {
                      const currentIdx = getStepIndex(selectedOrder.status);
                      const isDone = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      const IconComp = step.icon;

                      return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center">
                          <div 
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isCurrent
                                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/50 scale-110 ring-4 ring-amber-500/20'
                                : isDone
                                ? 'bg-emerald-500 text-black'
                                : 'bg-neutral-900 text-gray-500 border border-white/10'
                            }`}
                          >
                            <IconComp className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <span className={`text-[11px] font-semibold mt-2 ${isCurrent ? 'text-amber-400 font-bold' : isDone ? 'text-gray-300' : 'text-gray-600'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Order Items & Delivery Info */}
              <div className="grid md:grid-cols-2 gap-4">
                
                {/* Items */}
                <div className="glass-panel p-4">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Items Ordered</h4>
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {selectedOrder.items?.map((it, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                        <span className="text-white font-medium">{it.name} <span className="text-amber-400">×{it.quantity}</span></span>
                        <span className="text-gray-300 font-mono">₹{it.subtotal || (it.price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 mt-2 border-t border-white/10 flex justify-between font-bold text-sm text-amber-400">
                    <span>Total Paid</span>
                    <span className="font-sans">₹{selectedOrder.total_amount}</span>
                  </div>
                </div>

                {/* Delivery Address & Customer details */}
                <div className="glass-panel p-4">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Delivery Information</h4>
                  <p className="text-xs text-white font-semibold mb-1">{selectedOrder.customer_name || 'Guest User'}</p>
                  <p className="text-xs text-gray-400 mb-3">{selectedOrder.customer_phone}</p>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs text-gray-300 leading-relaxed">
                    <span className="text-[10px] text-amber-400 font-semibold block uppercase mb-1">Destination Address:</span>
                    {selectedOrder.address}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <ShoppingBag className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-300">No orders placed yet</p>
              <p className="text-xs text-gray-500">Your past orders will appear here once you place a request.</p>
            </div>
          )}

          {/* Past Orders Switcher List */}
          {orders.length > 1 && (
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Order History</h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {orders.map(ord => (
                  <button
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all border ${
                      selectedOrder?.id === ord.id
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    #{ord.id.slice(-6)} • ₹{ord.total_amount} ({ord.status})
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
