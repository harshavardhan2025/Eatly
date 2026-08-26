import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4 border-white/10 hover:border-amber-500/30 transition-all">
      <div className="flex items-center gap-3.5 min-w-[200px] flex-1">
        <img
          src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80"}
          alt={item.name}
          className="w-16 h-16 rounded-xl object-cover bg-neutral-900"
        />
        <div>
          <h4 className="font-bold text-white text-base">{item.name}</h4>
          <p className="text-xs text-amber-400 font-semibold mt-0.5">₹{item.price} each</p>
        </div>
      </div>

      {/* Quantity Adjuster */}
      <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-1.5">
        <button
          onClick={() => updateQuantity(item.food_item_id, item.quantity - 1)}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white flex items-center justify-center transition-all"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <span className="text-sm font-bold text-white px-2 min-w-[20px] text-center">
          {item.quantity}
        </span>

        <button
          onClick={() => updateQuantity(item.food_item_id, item.quantity + 1)}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white flex items-center justify-center transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtotal & Delete */}
      <div className="flex items-center gap-4 min-w-[100px] justify-end">
        <div className="text-right">
          <span className="text-[10px] text-gray-400 uppercase font-medium block">Subtotal</span>
          <span className="text-base font-bold text-white font-sans">
            ₹{item.price * item.quantity}
          </span>
        </div>

        <button
          onClick={() => removeFromCart(item.food_item_id)}
          className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
