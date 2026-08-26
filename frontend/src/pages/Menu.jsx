import { useEffect, useState } from "react";
import FoodCard from "../components/FoodCard";
import FoodLoader from "../components/FoodLoader";
import api from "../services/api";

function Menu() {

  const [foods, setFoods] = useState([]);
  const [category, setCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {

    const loadFoods = async () => {
      try {
        const data = await api.getFoodItems();
        setFoods(data || []);
      } catch (error) {
        console.error(error);
        setError(
          error.message || "Unable to load the menu."
        );
      } finally {
        setLoading(false);
      }
    };

    loadFoods();

  }, []);

  const categories = [
    "All",
    ...new Set(foods.map((food) => food.category).filter(Boolean)),
  ];

  // First preference: Available items shown first, remaining unavailable items shown after
  const filteredFoods = (
    category === "All"
      ? foods
      : foods.filter((food) => food.category === category)
  ).slice().sort((a, b) => {
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
