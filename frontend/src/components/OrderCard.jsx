import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Clock } from 'lucide-react';

export const OrderCard = ({ order }) => {
  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACCEPTED':
        return { text: '🟢 ACCEPTED', style: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
      case 'PREPARING':
        return { text: '🟡 PREPARING', style: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
      case 'READY':
        return { text: '🔵 READY FOR PICKUP', style: 'bg-blue-500/20 text-blue-400 border-blue-500/40' };
      case 'DELIVERED':
        return { text: '✅ DELIVERED', style: 'bg-gray-500/20 text-gray-300 border-gray-500/40' };
      case 'REJECTED':
        return { text: '🔴 REJECTED', style: 'bg-red-500/20 text-red-400 border-red-500/40' };
      default:
        return { text: '⚪ PLACED', style: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
    }
  };

  const badge = getStatusBadge(order.status);

  return (
    <div className="glass-panel p-5 border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between">
      <div>
        {/* Order Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div>
            <span className="text-xs text-amber-400 font-semibold tracking-wider block">ORDER</span>
            <h3 className="font-mono font-bold text-white text-lg">#{order.id}</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${badge.style}`}>
            {badge.text}
          </span>
        </div>

        {/* Items Summary */}
        <div className="space-y-1.5 mb-4 text-xs text-gray-300">
          {order.items?.map((it, i) => (
            <div key={i} className="flex justify-between">
              <span>{it.name} <strong className="text-amber-400">× {it.quantity}</strong></span>
              <span className="font-mono text-gray-400">₹{it.subtotal || (it.price * it.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Total</span>
          <span className="text-lg font-bold text-white font-sans">₹{order.total_amount}</span>
        </div>

        <Link
          to={`/orders/${order.id}`}
          className="btn-secondary text-xs font-semibold hover:border-amber-500/50"
        >
          <span>VIEW DETAILS</span>
          <ChevronRight className="w-4 h-4 text-amber-400" />
        </Link>
      </div>
    </div>
  );
};
