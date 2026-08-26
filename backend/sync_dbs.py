from pymongo import MongoClient
import bcrypt

def get_hash(pwd):
    return bcrypt.hashpw(pwd.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")

dishes = [
    {
        "name": "Hyderabadi Chicken Biryani",
        "description": "Slow-cooked aromatic basmati rice with marinated tender chicken, saffron, and rich royal spices.",
        "price": 280.0,
        "category": "Biryani",
        "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
        "image": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
        "is_available": True,
        "available": True,
    },
    {
        "name": "Paneer Butter Masala",
        "description": "Soft cottage cheese cubes simmered in a creamy, velvety tomato and cashew nut gravy.",
        "price": 230.0,
        "category": "Main Course",
        "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800",
        "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800",
        "is_available": True,
        "available": True,
    },
    {
        "name": "Crispy Chicken 65",
        "description": "Deep-fried boneless chicken chunks marinated in South Indian spices, garlic, and curry leaves.",
        "price": 190.0,
        "category": "Starters",
        "image_url": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800",
        "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800",
        "is_available": True,
        "available": True,
    },
    {
        "name": "Tandoori Butter Naan",
        "description": "Freshly baked tandoori Indian flatbread generously brushed with rich melted butter.",
        "price": 45.0,
        "category": "Main Course",
        "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800",
        "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800",
        "is_available": True,
        "available": True,
    },
    {
        "name": "Chilled Beverage (Coke 330ml)",
        "description": "Refreshing chilled Coca-Cola to perfectly pair with your warm spicy meal.",
        "price": 50.0,
        "category": "Beverages",
        "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800",
        "image": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800",
        "is_available": True,
        "available": True,
    },
]

admin_user = {
    "name": "Restaurant Admin",
    "phone": "9999999999",
    "password_hash": get_hash("admin123"),
    "role": "admin",
}

customer_user = {
    "name": "Regular Customer",
    "phone": "9876543210",
    "password_hash": get_hash("user123"),
    "role": "customer",
}

def sync_database(client, db_name="heritage_restaurant_db"):
    db = client[db_name]
    # 1. Admin & Customer Users
    if not db.users.find_one({"phone": "9999999999"}):
        db.users.insert_one(admin_user)
        print(f"[{db_name}] Seeded Admin user (9999999999)")
    if not db.users.find_one({"phone": "9876543210"}):
        db.users.insert_one(customer_user)
        print(f"[{db_name}] Seeded Customer user (9876543210)")

    # 2. Food items
    if db.food_items.count_documents({}) == 0:
        db.food_items.insert_many(dishes)
        print(f"[{db_name}] Seeded 5 authentic dishes")
    else:
        print(f"[{db_name}] Current Food Items count: {db.food_items.count_documents({})}")

if __name__ == "__main__":
    print("--- SYNCING LOCAL MONGODB ---")
    try:
        local_client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
        sync_database(local_client)
    except Exception as e:
        print("Local DB sync notice:", e)
