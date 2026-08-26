from backend.app.database import users_collection, food_items_collection
from backend.app.core.security import get_password_hash

def seed():
    # Admin User
    admin_phone = "9999999999"
    if not users_collection.find_one({"phone": admin_phone}):
        users_collection.insert_one({
            "name": "Restaurant Admin",
            "phone": admin_phone,
            "password_hash": get_password_hash("admin123"),
            "role": "admin",
        })
        print("[SUCCESS] Admin created: Phone 9999999999 / Password admin123")
    else:
        print("[INFO] Admin user already exists")

    # Sample Menu
    if food_items_collection.count_documents({}) == 0:
        sample_items = [
            {
                "name": "Chicken Biryani",
                "description": "Authentic fragrant basmati rice cooked with tender marinated chicken & royal spices.",
                "price": 250.0,
                "category": "Biryani",
                "image_url": "/images/biryani.jpg",
                "is_available": True,
            },
            {
                "name": "Veg Biryani",
                "description": "Flavorful dum-cooked rice with garden-fresh veggies, mint, and saffron aroma.",
                "price": 180.0,
                "category": "Biryani",
                "image_url": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800",
                "is_available": True,
            },
            {
                "name": "Chicken 65",
                "description": "Crisp and fiery South-Indian style boneless fried chicken with curry leaves.",
                "price": 180.0,
                "category": "Starters",
                "image_url": "/images/chicken65.jpg",
                "is_available": True,
            },
            {
                "name": "Paneer 65",
                "description": "Crispy paneer tossed with aromatic spices.",
                "price": 160.0,
                "category": "Starters",
                "image_url": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800",
                "is_available": True,
            },
            {
                "name": "Veg Meals",
                "description": "Complete traditional vegetarian meal.",
                "price": 150.0,
                "category": "Main Course",
                "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800",
                "is_available": True,
            },
            {
                "name": "Coke",
                "description": "Ice-cold Coca Cola (330 ml can).",
                "price": 50.0,
                "category": "Beverages",
                "image_url": "/images/coke.jpg",
                "is_available": True,
            },
        ]
        food_items_collection.insert_many(sample_items)
        print("[SUCCESS] Sample food items seeded successfully!")
    else:
        print("[INFO] Food items already seeded")

if __name__ == "__main__":
    seed()
