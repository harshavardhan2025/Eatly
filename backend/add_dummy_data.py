from backend.app.database import users_collection, food_items_collection
from backend.app.core.security import get_password_hash

def add_dummy_data():
    print("[INFO] Adding dummy data to MongoDB...")

    # 1. Dummy User
    customer_phone = "9876543210"
    existing_user = users_collection.find_one({"phone": customer_phone})
    
    if not existing_user:
        user_doc = {
            "name": "Harsha",
            "phone": customer_phone,
            "password_hash": get_password_hash("test123"),
            "role": "customer"
        }
        res_user = users_collection.insert_one(user_doc)
        print(f"[SUCCESS] Added dummy user: Name: Harsha | Phone: 9876543210 | Password: test123 | ID: {res_user.inserted_id}")
    else:
        print(f"[INFO] Dummy user with phone {customer_phone} already exists (ID: {existing_user['_id']})")

    # 2. Dummy Food Item
    food_name = "Chicken Biryani"
    existing_food = food_items_collection.find_one({"name": food_name})

    if not existing_food:
        food_doc = {
            "name": "Chicken Biryani",
            "description": "Special chicken biryani with aromatic basmati rice and spices",
            "price": 250.0,
            "category": "Biryani",
            "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
            "is_available": True
        }
        res_food = food_items_collection.insert_one(food_doc)
        print(f"[SUCCESS] Added dummy food item: Chicken Biryani | Price: Rs. 250 | Category: Biryani | ID: {res_food.inserted_id}")

    else:
        print(f"[INFO] Dummy food item '{food_name}' already exists (ID: {existing_food['_id']})")

if __name__ == "__main__":
    add_dummy_data()
