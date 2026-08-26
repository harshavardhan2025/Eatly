import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShoppingBag, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminOrders();
      setOrders(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const filteredOrders = statusFilter === 'ALL'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  return (
    <div className="pt-24 pb-16 px-4 lg:px-8 max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Restaurant Admin</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-white">All Orders Management</h1>
        </div>

        <button onClick={fetchOrders} className="btn-secondary text-xs font-semibold">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Sub Navigation Bar */}
      <div className="glass-panel p-3 flex flex-wrap gap-3 border-amber-500/20">
        <Link to="/admin/dashboard" className="btn-secondary text-xs py-2 px-4">
          Dashboard
        </Link>
        <Link to="/admin/orders" className="btn-primary text-xs py-2 px-4 font-bold">
          Orders ({orders.length})
        </Link>
        <Link to="/admin/menu" className="btn-secondary text-xs py-2 px-4">
          Menu Management
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['ALL', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERED', 'REJECTED'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              statusFilter === st
                ? 'bg-amber-500 text-black border-amber-400'
                : 'bg-white/5 text-gray-300 border-white/10 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="glass-panel h-40 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="glass-panel p-12 text-center text-gray-400">
          <ShoppingBag className="w-12 h-12 mx-auto text-neutral-700 mb-3" />
          <p className="text-sm font-semibold">No orders found for filter "{statusFilter}"</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="glass-panel p-6 border-white/10 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-mono font-bold text-white text-lg">Order #{order.id}</h3>
                  <p className="text-xs text-amber-400 font-semibold mt-0.5">
                    Customer: {order.customer_name} (<a href={`tel:${order.customer_phone}`} className="hover:underline text-amber-500">📞 {order.customer_phone}</a>)
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">Address: {order.address}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-white font-sans">₹{order.total_amount}</span>

                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                    className="bg-neutral-900 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="PLACED">PLACED</option>
                    <option value="ACCEPTED">ACCEPTED</option>
                    <option value="PREPARING">PREPARING</option>
                    <option value="READY">READY</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 text-xs text-gray-300">
                {order.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.name} <strong className="text-amber-400">× {it.quantity}</strong></span>
                    <span className="font-mono text-gray-400">₹{it.subtotal || (it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
