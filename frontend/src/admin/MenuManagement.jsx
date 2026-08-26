import React, { useState, useEffect } from "react";
import { api } from "../services/api";

function MenuManagement() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Biryani",
    image: "/images/biryani.jpg",
    available: true,
    is_veg: true,
  });

  const availableImages = [
    { label: "Chicken Biryani", path: "/images/biryani.jpg" },
    { label: "Chicken 65", path: "/images/chicken65.jpg" },
    { label: "Coke Drink", path: "/images/coke.jpg" },
  ];

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const data = await api.getFoodItems();
      setFoods(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "Biryani",
      image: "/images/biryani.jpg",
      available: true,
      is_veg: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (food) => {
    setEditingId(food.id);
    setFormData({
      name: food.name,
      description: food.description || "",
      price: food.price.toString(),
      category: food.category || "Biryani",
      image: food.image_url || food.image || "/images/biryani.jpg",
      available: food.is_available !== false,
      is_veg: food.is_veg !== false,
    });
    setShowModal(true);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAvailability = async (food) => {
    try {
      await api.updateFoodItem(food.id, { is_available: !(food.is_available !== false) });
      fetchMenu();
    } catch (err) {
      alert(err.message || "Failed to update availability.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this food item?")) {
      try {
        await api.deleteFoodItem(id);
        fetchMenu();
      } catch (err) {
        alert(err.message || "Failed to delete item.");
      }
    }
  };

  const handleSaveFood = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert("Please fill in Name and Price.");
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        image_url: formData.image,
        is_available: formData.available,
        is_veg: formData.is_veg,
      };

      if (editingId) {
        await api.updateFoodItem(editingId, payload);
      } else {
        await api.createFoodItem(payload);
      }

      setShowModal(false);
      fetchMenu();
    } catch (err) {
      alert(err.message || "Failed to save food item.");
    }
  };

  return (
    <main className="admin-page">

      <div className="admin-header">
        <div>
          <p>RESTAURANT ADMIN</p>
          <h1>Menu Management</h1>
        </div>

        <button className="primary-button" onClick={handleOpenAdd}>
          + Add Food
        </button>
      </div>

      {loading ? (
        <p className="center">Loading menu items...</p>
      ) : (
        <div className="admin-menu">
          {foods.map((food) => (
            <div className="admin-food" key={food.id}>
              <img src={food.image_url || food.image} alt={food.name} />

              <div>
                <h3>{food.name}</h3>
                <p style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{food.category || "Biryani"}</span>
                  <span style={{ color: "#cbd5e1" }}>|</span>
                  <span style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: food.is_veg !== false ? '#22c55e' : '#ef4444',
                  }}></span>
                  <span style={{ fontSize: "12px", color: food.is_veg !== false ? "#16a34a" : "#dc2626", fontWeight: "bold" }}>
                    {food.is_veg !== false ? "Veg" : "Non-Veg"}
                  </span>
                </p>
                <strong>₹{food.price}</strong>
              </div>

              <span className={food.is_available !== false ? "status-available" : "status-unavailable"}>
                {food.is_available !== false ? "Available" : "Unavailable"}
              </span>

              <button onClick={() => toggleAvailability(food)}>
                {food.is_available !== false ? "Disable" : "Enable"}
              </button>

              <button onClick={() => handleOpenEdit(food)}>Edit</button>

              <button onClick={() => handleDelete(food.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Food Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="auth-card modal-card">
            <h2>{editingId ? "Edit Food" : "Add New Food"}</h2>

            <form onSubmit={handleSaveFood}>
              <label>Name</label>
              <input
                type="text"
                required
                placeholder="Dish Name (e.g. Chicken Biryani)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="select-input"
              >
                <option value="Biryani">Biryani</option>
                <option value="Starters">Starters</option>
                <option value="Main Course">Main Course</option>
                <option value="Beverages">Beverages</option>
              </select>

              <label>Description</label>
              <textarea
                placeholder="Delicious ingredients and preparation style..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <label>Price (₹)</label>
              <input
                type="number"
                step="1"
                required
                placeholder="250"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />

              {/* Image Selection & Upload */}
              <label>Dish Image</label>

              <div className="image-selection-box">
                <p className="small-text">Select from Image Manager:</p>
                <div className="image-thumbnails">
                  {availableImages.map((imgItem) => (
                    <div
                      key={imgItem.path}
                      className={`thumb-box ${formData.image === imgItem.path ? "selected" : ""}`}
                      onClick={() => setFormData({ ...formData, image: imgItem.path })}
                    >
                      <img src={imgItem.path} alt={imgItem.label} />
                      <span>{imgItem.label}</span>
                    </div>
                  ))}
                </div>

                <p className="small-text" style={{ marginTop: "12px" }}>Or Upload Image File from Device:</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                />

                <p className="small-text" style={{ marginTop: "8px" }}>Or Enter Image URL / Path:</p>
                <input
                  type="text"
                  placeholder="/images/biryani.jpg"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
              </div>

              {/* Preview */}
              {formData.image && (
                <div className="image-preview font-small">
                  <span>Image Preview:</span>
                  <img src={formData.image} alt="Preview" />
                </div>
              )}

              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                />
                <label htmlFor="availCheck">Available [ ✓ ]</label>
              </div>

              <label>Dietary Type</label>
              <div className="radio-group" style={{ display: "flex", gap: "20px", marginBottom: "16px", marginTop: "8px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "600" }}>
                  <input
                    type="radio"
                    name="dietType"
                    checked={formData.is_veg === true}
                    onChange={() => setFormData({ ...formData, is_veg: true })}
                    style={{ cursor: "pointer", width: "18px", height: "18px", accentColor: "#16a34a" }}
                  />
                  Vegetarian 🌿
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "600" }}>
                  <input
                    type="radio"
                    name="dietType"
                    checked={formData.is_veg === false}
                    onChange={() => setFormData({ ...formData, is_veg: false })}
                    style={{ cursor: "pointer", width: "18px", height: "18px", accentColor: "#dc2626" }}
                  />
                  Non-Vegetarian 🍗
                </label>
              </div>

              <div className="modal-actions">
                <button type="submit" className="primary-button">
                  [ SAVE FOOD ]
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}

export default MenuManagement;
