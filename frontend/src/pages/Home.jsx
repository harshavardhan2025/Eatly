import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import FoodCard from "../components/FoodCard";
import Footer from "../components/Footer";
import { Star, BookOpen, ArrowRight, UserPlus, Flame, ChefHat, Leaf, Truck } from "lucide-react";

function Home() {
  const { user } = useAuth();
  const [popularDishes, setPopularDishes] = useState([]);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const data = await api.getFoodItems();
        if (data && data.length > 0) {
          const availableDishes = data.filter(food => food.available !== false && food.is_available !== false);
          setPopularDishes(availableDishes.slice(0, 3));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchPopular();
  }, []);

  return (
    <>
      <div className="home-container">
        {/* Creative Hero Section */}
        <section className="hero">
          <div className="hero-grid-container">
            <div className="hero-content">
              <span className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Star size={14} className="text-amber-400 fill-amber-400" /> FRESH & AUTHENTIC FOOD
              </span>

              <h1>
                Delicious Meals, <br />
                <span className="hero-gradient-text">Delivered Hot to Your Door</span>
              </h1>

              <p>
                Enjoy handcrafted dishes made with fresh ingredients and authentic heirloom recipes. Order online for fast, hot, and reliable delivery.
              </p>

              <div className="hero-actions">
                <Link to="/menu" className="hero-primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={18} /> Browse Menu <ArrowRight size={18} />
                </Link>
                {!user && (
                  <Link to="/register" className="hero-secondary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserPlus size={18} /> Create Account
                  </Link>
                )}
              </div>
            </div>

            {/* Creative Food Showcase Card */}
            <div className="hero-image-showcase">
              <div className="hero-card-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800"
                  alt="Special Royal Biryani"
                  className="hero-main-img"
                />
                <div className="floating-badge top-right" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flame size={16} className="text-amber-500 fill-amber-500" /> <span>Chef's Special</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Creative Features Grid */}
        <section className="features">
          <div className="feature-card">
            <div className="feature-emoji"><ChefHat size={40} color="#d97706" /></div>
            <h3>Authentic Recipes</h3>
            <p>Prepared daily with quality ingredients and traditional slow-cooked methods.</p>
          </div>

          <div className="feature-card">
            <div className="feature-emoji"><Leaf size={40} color="#10b981" /></div>
            <h3>Fresh Spices</h3>
            <p>We source fresh, high-quality spices and produce for rich, natural flavor.</p>
          </div>

          <div className="feature-card">
            <div className="feature-emoji"><Truck size={40} color="#3b82f6" /></div>
            <h3>Fast Delivery</h3>
            <p>Insulated thermal packaging ensuring meal warmth from kitchen to your table.</p>
          </div>
        </section>

        {/* Popular Dishes Preview Section */}
        {popularDishes.length > 0 && (
          <section className="section popular-section">
            <div className="section-heading">
              <p>CUSTOMER FAVORITES</p>
              <h2>Popular Dishes</h2>
            </div>

            <div className="food-grid">
              {popularDishes.map((food) => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>

            <div className="center" style={{ marginTop: "40px" }}>
              <Link to="/menu" className="secondary-button" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                View Complete Menu <ArrowRight size={18} />
              </Link>
            </div>
          </section>
        )}
      </div>
      <Footer />
    </>
  );
}

export default Home;
