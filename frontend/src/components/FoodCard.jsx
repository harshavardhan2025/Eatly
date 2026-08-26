import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Heart } from "lucide-react";

function FoodCard({ food }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const [added, setAdded] = useState(false);
  const [likes, setLikes] = useState(food.liked_by || []);
  
  const isAvailable = food.available !== false && food.is_available !== false;
  const isLikedByMe = user && likes.includes(user.id);
  const likesCount = likes.length;

  const handleAdd = () => {
    addToCart(food);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 1000);
  };

  const handleLikeToggle = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to like dishes!");
      return;
    }
    
    try {
      if (isLikedByMe) {
        await api.unlikeFoodItem(food.id);
        setLikes(likes.filter(id => id !== user.id));
      } else {
        await api.likeFoodItem(food.id);
        setLikes([...likes, user.id]);
      }
    } catch (err) {
      console.error("Failed to toggle like", err);
    }
  };

  const imageSrc = food.image || food.image_url;

  return (
    <div className={`food-card ${!isAvailable ? "unavailable-card" : "available-card"}`}>
      <div className="food-image-wrapper">
        {imageSrc && (
          <img
            src={imageSrc}
            alt={food.name}
          />
        )}
        {!isAvailable && (
          <div className="unavailable-overlay">
            <span>OUT OF STOCK</span>
          </div>
        )}
        
        {/* Like Button overlay */}
        <button 
          className="food-like-btn"
          onClick={handleLikeToggle}
          aria-label={isLikedByMe ? "Unlike" : "Like"}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10,
            transition: 'all 0.2s ease'
          }}
        >
          <Heart 
            size={20} 
            color={isLikedByMe ? "#ef4444" : "#64748b"} 
            fill={isLikedByMe ? "#ef4444" : "none"}
            style={{ transition: 'all 0.2s ease' }}
          />
        </button>
      </div>

      <div className="food-card-content">
        <div className="food-card-header">
          <span className="food-category">{food.category}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '16px', height: '16px', border: `1.5px solid ${food.is_veg !== false ? '#16a34a' : '#dc2626'}`, borderRadius: '2px'
            }} title={food.is_veg !== false ? "Vegetarian" : "Non-Vegetarian"}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%', backgroundColor: food.is_veg !== false ? '#16a34a' : '#dc2626'
              }}></div>
            </div>
            {likesCount >= 1 && (
              <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                <Heart size={14} fill="#ef4444" color="#ef4444" /> {likesCount}
              </span>
            )}
            <span className={`status-pill ${isAvailable ? "available" : "unavailable"}`}>
              {isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>
        </div>

        <h3>{food.name}</h3>

        <p>{food.description}</p>

        <div className="food-bottom">
          <strong className="food-price">
            ₹{food.price}
          </strong>

          {isAvailable ? (
            <button
              className={`primary-button add-btn ${added ? "added-btn-animation" : ""}`}
              onClick={handleAdd}
            >
              {added ? "✓ Added!" : "+ Add to Cart"}
            </button>
          ) : (
            <button className="primary-button add-btn disabled-btn" disabled>
              Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FoodCard;
