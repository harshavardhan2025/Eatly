import sys
sys.path.insert(0, '.')

from app.database import init_db, db, users_collection, food_items_collection, orders_collection, complaints_collection
from app.core.security import get_password_hash
from datetime import datetime, timezone

print("=" * 60)
print("  INITIALIZING DATABASE: food_ordering")
print("=" * 60)

# Step 1: Create all collections + indexes
init_db()

print()
print("=== Seeding Data ===")

# Step 2: Admin user
admin_phone = "9999999999"
if not users_collection.find_one({"phone": admin_phone}):
    users_collection.insert_one({
        "name": "Restaurant Admin",
        "phone": admin_phone,
        "password_hash": get_password_hash("admin123"),
        "role": "admin",
    })
    print("[SEED] Admin user created.")
else:
    print("[SEED] Admin user already exists.")

# Step 3: Food items
seeded_food_ids = {}
if food_items_collection.count_documents({}) == 0:
    five_dishes = [
        {"name": "Hyderabadi Chicken Biryani", "description": "Slow-cooked aromatic basmati rice with marinated tender chicken, saffron, and rich royal spices.", "price": 280.0, "category": "Biryani", "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800", "is_available": True, "available": True},
        {"name": "Paneer Butter Masala", "description": "Soft cottage cheese cubes simmered in a creamy, velvety tomato and cashew nut gravy.", "price": 230.0, "category": "Main Course", "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800", "is_available": True, "available": True},
        {"name": "Crispy Chicken 65", "description": "Deep-fried boneless chicken chunks marinated in South Indian spices, garlic, and curry leaves.", "price": 190.0, "category": "Starters", "image_url": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800", "is_available": True, "available": True},
        {"name": "Tandoori Butter Naan", "description": "Freshly baked tandoori Indian flatbread generously brushed with rich melted butter.", "price": 45.0, "category": "Main Course", "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800", "is_available": True, "available": True},
        {"name": "Chilled Beverage (Coke 330ml)", "description": "Refreshing chilled Coca-Cola to perfectly pair with your warm spicy meal.", "price": 50.0, "category": "Beverages", "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800", "is_available": True, "available": True},
    ]
    result = food_items_collection.insert_many(five_dishes)
    for dish, oid in zip(five_dishes, result.inserted_ids):
        seeded_food_ids[dish["name"]] = oid
    print(f"[SEED] Inserted {len(five_dishes)} food items.")
else:
    for doc in food_items_collection.find({}, {"_id": 1, "name": 1}):
        seeded_food_ids[doc["name"]] = doc["_id"]
    print(f"[SEED] Food items already exist ({len(seeded_food_ids)} found).")

# Step 4: Demo customers
demo_users = {}
for u in [{"name": "Rohan Sharma", "phone": "9876543210"}, {"name": "Priya Patel", "phone": "9123456789"}]:
    existing = users_collection.find_one({"phone": u["phone"]})
    if existing:
        demo_users[u["phone"]] = existing["_id"]
        print(f"[SEED] User {u['name']} already exists.")
    else:
        res = users_collection.insert_one({"name": u["name"], "phone": u["phone"], "password_hash": get_password_hash("demo1234"), "role": "customer"})
        demo_users[u["phone"]] = res.inserted_id
        print(f"[SEED] Inserted demo user: {u['name']}")

# Step 5: Demo orders with real FK links
seeded_order_ids = {}
if orders_collection.count_documents({}) == 0:
    biryani_id = seeded_food_ids.get("Hyderabadi Chicken Biryani")
    paneer_id  = seeded_food_ids.get("Paneer Butter Masala")
    naan_id    = seeded_food_ids.get("Tandoori Butter Naan")
    demo_orders = [
        {
            "user_id": str(demo_users["9876543210"]),           # FK -> users._id
            "customer_name": "Rohan Sharma", "customer_phone": "9876543210",
            "address": "12, MG Road, Bangalore - 560001",
            "items": [{"food_item_id": str(biryani_id), "name": "Hyderabadi Chicken Biryani", "quantity": 2, "price": 280.0, "subtotal": 560.0}],
            "total_amount": 560.0, "status": "DELIVERED", "created_at": datetime.now(timezone.utc),
        },
        {
            "user_id": str(demo_users["9123456789"]),           # FK -> users._id
            "customer_name": "Priya Patel", "customer_phone": "9123456789",
            "address": "45, Jubilee Hills, Hyderabad - 500033",
            "items": [
                {"food_item_id": str(paneer_id), "name": "Paneer Butter Masala", "quantity": 1, "price": 230.0, "subtotal": 230.0},  # FK -> food_items._id
                {"food_item_id": str(naan_id),   "name": "Tandoori Butter Naan", "quantity": 2, "price": 45.0,  "subtotal": 90.0},   # FK -> food_items._id
            ],
            "total_amount": 320.0, "status": "PLACED", "created_at": datetime.now(timezone.utc),
        },
    ]
    result = orders_collection.insert_many(demo_orders)
    for label, oid in zip(["rohan_order", "priya_order"], result.inserted_ids):
        seeded_order_ids[label] = oid
    print(f"[SEED] Inserted {len(demo_orders)} orders with FK links.")
else:
    for doc in orders_collection.find({}, {"_id": 1, "customer_phone": 1}):
        key = str(doc.get("customer_phone", "unk")) + "_order"
        seeded_order_ids[key] = doc["_id"]
    print(f"[SEED] Orders already exist ({len(seeded_order_ids)} found).")

# Step 6: Complaints with real FK links
if complaints_collection.count_documents({}) == 0:
    rohan_order = seeded_order_ids.get("rohan_order") or seeded_order_ids.get("9876543210_order")
    priya_order = seeded_order_ids.get("priya_order") or seeded_order_ids.get("9123456789_order")
    dummy_complaints = [
        {
            "customer_name": "Rohan Sharma", "customer_phone": "9876543210",
            "issue": "The Hyderabadi Chicken Biryani was too spicy and slightly cold when delivered.",
            "status": "OPEN", "created_at": datetime.now(timezone.utc),
            "user_id":  demo_users.get("9876543210"),   # FK -> users._id
            "order_id": rohan_order,                     # FK -> orders._id
        },
        {
            "customer_name": "Priya Patel", "customer_phone": "9123456789",
            "issue": "Paneer Butter Masala had fewer paneer pieces than usual.",
            "status": "RESOLVED", "created_at": datetime.now(timezone.utc),
            "user_id":  demo_users.get("9123456789"),   # FK -> users._id
            "order_id": priya_order,                     # FK -> orders._id
        },
    ]
    complaints_collection.insert_many(dummy_complaints)
    print(f"[SEED] Inserted {len(dummy_complaints)} complaints with FK links.")
else:
    print(f"[SEED] Complaints already exist ({complaints_collection.count_documents({})} found).")

print()
print("=" * 60)
print("  FINAL DATABASE STATE")
print("=" * 60)
for col_name in ["users", "food_items", "orders", "complaints"]:
    col = db[col_name]
    count = col.count_documents({})
    indexes = list(col.list_indexes())
    print(f"\n  [{col_name}]  docs={count}  indexes={len(indexes)}")
    for idx in indexes:
        key_str = ", ".join(f"{k}:{v}" for k, v in idx["key"].items())
        print(f"       {idx['name']}  ({key_str})")

print()
print("  RELATIONSHIPS IN DB:")
print("  orders.user_id              -> users._id")
print("  orders.items[].food_item_id -> food_items._id")
print("  complaints.user_id          -> users._id   (sparse)")
print("  complaints.order_id         -> orders._id  (sparse)")
print()
print("ALL DONE!")
