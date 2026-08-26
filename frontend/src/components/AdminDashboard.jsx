import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, DollarSign, ShoppingBag, Clock, CheckCircle2, XCircle, RefreshCw, Eye, AlertCircle, Users, Ban, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import FoodLoader from './FoodLoader';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'menu' | 'users'
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_available: true
  });
  const [error, setError] = useState('');

  // Add User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({ name: '', phone: '', password: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [orderRes, menuRes, userRes] = await Promise.all([
        api.getAdminOrders(),
        api.getFoodItems(),
        api.getAdminUsers(),
      ]);
      setOrders(orderRes || []);
      setMenuItems(menuRes || []);
      setUsers(userRes || []);
    } catch (e) {
      console.error("Admin fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Menu item actions ────────────────────────────────────
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '', price: '', image_url: '', is_available: true });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      image_url: item.image_url || '',
      is_available: item.is_available
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.price) {
      setError('Item name and price are required');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image_url: formData.image_url,
        is_available: formData.is_available
      };

      if (editingItem) {
        await api.updateFoodItem(editingItem.id, payload);
      } else {
        await api.createFoodItem(payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to save menu item');
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await api.deleteFoodItem(id);
        fetchData();
      } catch (err) {
        alert(err.message || 'Failed to delete item');
      }
    }
  };

  const handleToggleStock = async (item) => {
    try {
      await api.updateFoodItem(item.id, { is_available: !item.is_available });
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update stock state');
    }
  };

  // ── Order Status update action ───────────────────────────
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    }
  };

  // ── User actions ─────────────────────────────────────────
  const handleOpenUserModal = () => {
    setUserFormData({ name: '', phone: '', password: '' });
    setError('');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError('');
    if (!userFormData.name || !userFormData.phone || !userFormData.password) {
      setError('Name, phone, and password are required');
      return;
    }
    try {
      await api.createAdminUser(userFormData);
      setIsUserModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Delete customer "${user.name}" (${user.phone})? This cannot be undone.`)) {
      try {
        await api.deleteAdminUser(user.id);
        fetchData();
      } catch (err) {
        alert(err.message || 'Failed to delete user');
      }
    }
  };

  const handleToggleBlock = async (user) => {
    const isBlocked = user.role === 'blocked';
    const action = isBlocked ? 'unblock' : 'block';
    if (window.confirm(`Are you sure you want to ${action} "${user.name}"?`)) {
      try {
        await api.updateAdminUser(user.id, {
          name: user.name,
          role: isBlocked ? 'customer' : 'blocked',
        });
        fetchData();
      } catch (err) {
        alert(err.message || `Failed to ${action} user`);
      }
    }
  };

  // ── Metrics ──────────────────────────────────────────────
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'REJECTED' ? o.total_amount : 0), 0);
  const activeOrdersCount = orders.filter(o => ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)).length;
  const customerCount = users.filter(u => u.role !== 'admin').length;
  const blockedCount = users.filter(u => u.role === 'blocked').length;

  const filteredOrders = statusFilter === 'ALL'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  if (loading && orders.length === 0 && menuItems.length === 0 && users.length === 0) {
    return (
      <div className="pt-24 pb-12 flex justify-center min-h-[60vh] items-center">
        <FoodLoader text="⏳ 📊 Loading Admin Dashboard..." />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-4 lg:px-8 max-w-7xl mx-auto space-y-6">

      {/* Admin Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Restaurant Management Suite</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-white">Admin Control Dashboard</h1>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 btn-secondary text-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? "⏳ Refreshing..." : "Refresh Data"}</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Total Revenue</span>
            <span className="text-2xl font-bold text-white font-sans mt-1 block">₹{totalRevenue.toFixed(0)}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Active Queue</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">{activeOrdersCount} Orders</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 border-blue-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Total Processed</span>
            <span className="text-2xl font-bold text-white mt-1 block">{orders.length} Orders</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 border-purple-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Customers</span>
            <span className="text-2xl font-bold text-purple-300 mt-1 block">{customerCount} Users</span>
            {blockedCount > 0 && (
              <span className="text-[10px] text-red-400 font-semibold mt-0.5 block">{blockedCount} blocked</span>
            )}
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Tabs Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-gray-300 border-white/10 hover:text-white'
            }`}
          >
            Live Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-gray-300 border-white/10 hover:text-white'
            }`}
          >
            Menu Manager ({menuItems.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
              activeTab === 'users'
                ? 'bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/20'
                : 'bg-white/5 text-gray-300 border-white/10 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customers ({customerCount})
            </span>
          </button>
        </div>

        {activeTab === 'menu' && (
          <button
            onClick={handleOpenCreateModal}
            className="btn-primary text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish</span>
          </button>
        )}
      </div>

      {/* TAB 1: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-4">

          {/* Status Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['ALL', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERED', 'REJECTED', 'CANCELLED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  statusFilter === st
                    ? 'bg-white/20 text-amber-400 border-amber-400/40'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Orders Table / Cards */}
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="glass-panel p-12 text-center text-gray-400">
                <ShoppingBag className="w-12 h-12 mx-auto text-neutral-700 mb-3" />
                <p className="text-sm font-semibold">No orders match filter "{statusFilter}"</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="glass-panel p-5 border-white/10 hover:border-amber-500/30 transition-all">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-3 pb-3 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white text-base">#{order.id}</span>
                        <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-amber-400 font-semibold mt-0.5">
                        Customer: {order.customer_name} ({order.customer_phone})
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-white font-sans">₹{order.total_amount}</span>

                      {/* Status Update Dropdown */}
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
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Dishes Requested:</span>
                      <ul className="space-y-1 text-gray-300">
                        {order.items?.map((it, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span>• {it.name} <strong className="text-amber-400">×{it.quantity}</strong></span>
                            <span className="font-mono text-gray-400">₹{it.subtotal || (it.price * it.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-gray-300">
                      <span className="text-[10px] text-amber-400 uppercase font-semibold block mb-0.5">Delivery Address:</span>
                      <p className="leading-relaxed">{order.address}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MENU MANAGEMENT */}
      {activeTab === 'menu' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map(item => (
            <div key={item.id} className="glass-panel p-4 flex flex-col justify-between border-white/10">
              <div>
                <div className="relative h-36 rounded-xl overflow-hidden mb-3 bg-neutral-900">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => handleToggleStock(item)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        item.is_available
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-red-500/20 text-red-400 border-red-500/40'
                      }`}
                    >
                      {item.is_available ? 'In Stock' : 'Sold Out'}
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-white text-base">{item.name}</h3>
                <p className="text-xs text-gray-400 line-clamp-2 mt-1 mb-3">{item.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-lg font-bold text-white">₹{item.price}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-2 rounded-xl text-gray-300 hover:text-amber-400 hover:bg-white/10 transition-all border border-white/10"
                    title="Edit Item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all border border-white/10"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: USERS / CUSTOMERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Manage registered customers — block access or permanently delete accounts.
            </p>
            <button
              onClick={handleOpenUserModal}
              className="btn-primary text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>

          {users.filter(u => u.role !== 'admin').length === 0 ? (
            <div className="glass-panel p-12 text-center text-gray-400">
              <Users className="w-12 h-12 mx-auto text-neutral-700 mb-3" />
              <p className="text-sm font-semibold">No customers registered yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {users
                .filter(u => u.role !== 'admin')
                .map(user => {
                  const isBlocked = user.role === 'blocked';
                  return (
                    <div
                      key={user.id}
                      className={`glass-panel p-5 border transition-all flex flex-col gap-4 ${
                        isBlocked
                          ? 'border-red-500/30 bg-red-500/5'
                          : 'border-white/10 hover:border-purple-500/30'
                      }`}
                    >
                      {/* User Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Avatar circle */}
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                            isBlocked
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}>
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm leading-tight">{user.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">📞 {user.phone}</p>
                          </div>
                        </div>

                        {/* Role badge */}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                          isBlocked
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isBlocked ? '🚫 Blocked' : '✓ Active'}
                        </span>
                      </div>

                      {/* User ID */}
                      <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                        <span className="text-[10px] text-gray-500 uppercase font-semibold block mb-0.5">User ID</span>
                        <span className="font-mono text-[11px] text-gray-400 break-all">{user.id}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleToggleBlock(user)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                            isBlocked
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                          title={isBlocked ? 'Unblock this customer' : 'Block this customer'}
                        >
                          {isBlocked
                            ? <><UserCheck className="w-3.5 h-3.5" /> Unblock</>
                            : <><Ban className="w-3.5 h-3.5" /> Block</>
                          }
                        </button>

                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all"
                          title="Permanently delete this customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* CREATE / EDIT ITEM MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="w-full max-w-md glass-panel p-6 border border-amber-500/30 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h3 className="font-heading text-xl font-bold text-white mb-4">
              {editingItem ? 'Edit Menu Dish' : 'Add New Menu Dish'}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mutton Sukka"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Ingredients, spice level, preparation style..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="290"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-amber-500/50"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="stockToggle"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="rounded border-white/10 bg-white/5 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="stockToggle" className="text-xs font-semibold text-gray-300">
                  Available In Stock Immediately
                </label>
              </div>

              <button
                type="submit"
                className="w-full btn-primary justify-center py-2.5 text-xs font-bold uppercase tracking-wider"
              >
                {editingItem ? 'Update Dish Details' : 'Add Dish to Menu'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {isUserModalOpen && (
        <div className="modal-overlay">
          <div className="w-full max-w-md glass-panel p-6 border border-purple-500/30 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setIsUserModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h3 className="font-heading text-xl font-bold text-white mb-4">
              Add New Customer
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={userFormData.phone}
                  onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-purple-500/50"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-500 hover:bg-purple-600 text-white justify-center py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Create Customer Account
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
