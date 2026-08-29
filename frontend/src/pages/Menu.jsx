import { useEffect, useState } from "react";
import FoodCard from "../components/FoodCard";
import FoodLoader from "../components/FoodLoader";
import api from "../services/api";

function Menu() {

  const [foods, setFoods] = useState([]);
  const [category, setCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [dietaryPreference, setDietaryPreference] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFoods = async () => {
      try {
        const cached = localStorage.getItem("food_items_cache");
        if (cached) {
          setFoods(JSON.parse(cached));
          setLoading(false); // Stop loading immediately if cached data exists
        }

        const data = await api.getFoodItems();
        setFoods(data || []);
        localStorage.setItem("food_items_cache", JSON.stringify(data || []));
      } catch (error) {
        console.error(error);
        if (!localStorage.getItem("food_items_cache")) {
          setError(
            error.message || "Unable to load the menu."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadFoods();
  }, []);

  useEffect(() => {
    const handleMobileSearch = (e) => {
      setSearchTerm(e.detail);
    };
    window.addEventListener("mobile-menu-search", handleMobileSearch);
    return () => window.removeEventListener("mobile-menu-search", handleMobileSearch);
  }, []);

  const categories = [
    "All",
    ...new Set(foods.map((food) => food.category).filter(Boolean)),
  ];

  // First preference: Available items shown first, remaining unavailable items shown after
  // Filter by category
  let filteredFoods = category === "All"
    ? foods
    : foods.filter((food) => food.category === category);

  // Filter by search term
  if (searchTerm) {
    filteredFoods = filteredFoods.filter((food) =>
      food.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Filter by dietary preference
  if (dietaryPreference === "Veg") {
    filteredFoods = filteredFoods.filter((food) => food.is_veg !== false);
  } else if (dietaryPreference === "Non-Veg") {
    filteredFoods = filteredFoods.filter((food) => food.is_veg === false);
  }

  // First preference: Available items shown first, remaining unavailable items shown after
  filteredFoods = filteredFoods.slice().sort((a, b) => {
    const availA = (a.is_available !== false && a.available !== false) ? 1 : 0;
    const availB = (b.is_available !== false && b.available !== false) ? 1 : 0;
    return availB - availA;
  });

  if (loading) {
    return (
      <main className="page">
        <FoodLoader text="Preparing our royal food menu..." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <h1>{error}</h1>
      </main>
    );
  }

  return (
    <main className="page menu-page">

      <div className="page-heading">
        <p>OUR MENU</p>
        <h1>
          Choose Your Favorite Food
        </h1>
      </div>

      <div className="filters-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input desktop-search-input"
          style={{ padding: '10px 15px', borderRadius: '25px', border: '1px solid #ddd', minWidth: '250px', outline: 'none' }}
        />
        
        <div className="dietary-filters" style={{ display: 'flex', gap: '10px' }}>
          {["All", "Veg", "Non-Veg"].map((type) => (
            <button
              key={type}
              className={`category ${dietaryPreference === type ? "active" : ""}`}
              onClick={() => setDietaryPreference(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="categories">

        {categories.map((item) => (

          <button
            key={item}
            className={
              category === item
                ? "category active"
                : "category"
            }
            onClick={() =>
              setCategory(item)
            }
          >
            {item}
          </button>

        ))}

      </div>

      {filteredFoods.length === 0 ? (
        <div className="cart-empty-card official-card text-center" style={{ marginTop: "20px" }}>
          <div className="empty-icon">🍽️</div>
          <h2>No dishes found</h2>
          <p>There are currently no menu items in the database for this category.</p>
        </div>
      ) : (
        <div className="food-grid">
          {filteredFoods.map((food) => (
            <FoodCard
              key={food.id}
              food={{
                ...food,
                image: food.image_url || food.image,
                available: food.is_available !== false && food.available !== false,
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}

export default Menu;
