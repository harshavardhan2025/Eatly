import React from 'react';
import { Flame, Award, Clock, Star } from 'lucide-react';

export const Hero = ({ selectedCategory, setSelectedCategory }) => {
  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'biryani', label: 'Biryanis' },
    { id: 'starters', label: 'Starters & Appetizers' },
    { id: 'mains', label: 'Curries & Mains' },
    { id: 'breads', label: 'Naan & Breads' },
    { id: 'beverages', label: 'Beverages & Desserts' }
  ];

  return (
    <div className="relative pt-24 pb-8 px-4 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Banner Card */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-amber-500/20 p-8 lg:p-12 mb-8 bg-gradient-to-r from-neutral-900/90 via-neutral-900/70 to-amber-950/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Royal Mughlai & South Indian Traditions</span>
          </div>

          <h1 className="font-heading text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
            Taste the Legacy of <br />
            <span className="gold-gradient-text">Heritage Culinary Artistry</span>
          </h1>

          <p className="text-gray-300 text-base lg:text-lg mb-6 leading-relaxed">
            Handcrafted with freshly ground heirloom spices, aromatic basmati rice, and slow-cooked traditional recipes delivered hot to your doorstep.
          </p>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-white/10 text-xs text-gray-300 font-medium">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>4.9 Star Rating (2k+ Reviews)</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>30-40 Mins Express Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>100% Quality & Hygiene Guaranteed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-200 border ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-400 shadow-lg shadow-amber-500/25 scale-105'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10 hover:border-white/20'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};
