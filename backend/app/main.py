from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager

from .core.config import settings
from .core.security import get_password_hash
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from .database import db, users_collection, food_items_collection, orders_collection, complaints_collection
from .routers import auth, menu, orders, users, password_reset
from .routes import food as food_routes

# ...


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    On startup:
      1. Create all 4 MongoDB collections explicitly + apply all indexes
      2. Seed admin user, food items, and linked complaints (with real FK ObjectIds)
    """
    from datetime import datetime, timezone
    from bson import ObjectId
    from .database import init_db

    try:
        # ── Step 1: Create collections + relationships (indexes) ──────────────
        init_db()

        import os
        should_seed = settings.ENVIRONMENT == "development" or os.getenv("SEED_DB", "").lower() == "true"
        
        if should_seed:
            # ── Step 2: Seed default Admin user ──────────────────────────────────
            admin_phone = "9999999999"
            if not users_collection.find_one({"phone": admin_phone}):
                users_collection.insert_one({
                    "name": "Restaurant Admin",
                    "phone": admin_phone,
                    "password_hash": get_password_hash("admin123"),
                    "role": "admin",
                })
                print("[SEED] Seeded default Admin user (Phone: 9999999999 / Pass: admin123)")

        # ── Step 3: Seed 5 authentic food items ───────────────────────────────
        seeded_food_ids = {}   # name → ObjectId, used for FK references below
        if food_items_collection.count_documents({}) == 0:
            five_dishes = [
                {
                    "name": "Hyderabadi Chicken Biryani",
                    "description": "Slow-cooked aromatic basmati rice with marinated tender chicken, saffron, and rich royal spices.",
                    "price": 280.0,
                    "category": "Biryani",
                    "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
                    "is_available": True,
                    "available": True,
                },
                {
                    "name": "Paneer Butter Masala",
                    "description": "Soft cottage cheese cubes simmered in a creamy, velvety tomato and cashew nut gravy.",
                    "price": 230.0,
                    "category": "Main Course",
                    "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800",
                    "is_available": True,
                    "available": True,
                },
                {
                    "name": "Crispy Chicken 65",
                    "description": "Deep-fried boneless chicken chunks marinated in South Indian spices, garlic, and curry leaves.",
                    "price": 190.0,
                    "category": "Starters",
                    "image_url": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800",
                    "is_available": True,
                    "available": True,
                },
                {
                    "name": "Tandoori Butter Naan",
                    "description": "Freshly baked tandoori Indian flatbread generously brushed with rich melted butter.",
                    "price": 45.0,
                    "category": "Main Course",
                    "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800",
                    "is_available": True,
                    "available": True,
                },
                {
                    "name": "Chilled Beverage (Coke 330ml)",
                    "description": "Refreshing chilled Coca-Cola to perfectly pair with your warm spicy meal.",
                    "price": 50.0,
                    "category": "Beverages",
                    "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800",
                    "is_available": True,
                    "available": True,
                },
            ]
            result = food_items_collection.insert_many(five_dishes)
            for dish, oid in zip(five_dishes, result.inserted_ids):
                seeded_food_ids[dish["name"]] = oid
            print(f"[SEED] Seeded {len(five_dishes)} authentic food items.")
        else:
            # Load existing food item IDs for FK references
            for doc in food_items_collection.find({}, {"_id": 1, "name": 1}):
                seeded_food_ids[doc["name"]] = doc["_id"]

        # ── Step 4: Seed 2 demo customer users ────────────────────────────────
        demo_users = {}   # phone → ObjectId
        demo_user_data = [
            {"name": "Rohan Sharma",  "phone": "9876543210"},
            {"name": "Priya Patel",   "phone": "9123456789"},
        ]
        for u in demo_user_data:
            existing = users_collection.find_one({"phone": u["phone"]})
            if existing:
                demo_users[u["phone"]] = existing["_id"]
            else:
                res = users_collection.insert_one({
                    "name": u["name"],
                    "phone": u["phone"],
                    "password_hash": get_password_hash("demo1234"),
                    "role": "customer",
                })
                demo_users[u["phone"]] = res.inserted_id
                print(f"[SEED] Seeded demo user: {u['name']} ({u['phone']})")

        # ── Step 5: Seed demo orders with real FK links ───────────────────────
        #   orders.user_id     → users._id
        #   orders.items[].food_item_id → food_items._id
        seeded_order_ids = {}  # label → ObjectId
        if orders_collection.count_documents({}) == 0:
            biryani_id = seeded_food_ids.get("Hyderabadi Chicken Biryani")
            paneer_id  = seeded_food_ids.get("Paneer Butter Masala")
            naan_id    = seeded_food_ids.get("Tandoori Butter Naan")

            demo_orders = [
                {
                    # Order belongs to Rohan Sharma (FK → users._id)
                    "user_id":        str(demo_users["9876543210"]),
                    "customer_name":  "Rohan Sharma",
                    "customer_phone": "9876543210",
                    "address":        "12, MG Road, Bangalore - 560001",
                    "items": [
                        {
                            "food_item_id": str(biryani_id),   # FK → food_items._id
                            "name":         "Hyderabadi Chicken Biryani",
                            "quantity":     2,
                            "price":        280.0,
                            "subtotal":     560.0,
                        }
                    ],
                    "total_amount": 560.0,
                    "status":       "DELIVERED",
                    "created_at":   datetime.now(timezone.utc),
                },
                {
                    # Order belongs to Priya Patel (FK → users._id)
                    "user_id":        str(demo_users["9123456789"]),
                    "customer_name":  "Priya Patel",
                    "customer_phone": "9123456789",
                    "address":        "45, Jubilee Hills, Hyderabad - 500033",
                    "items": [
                        {
                            "food_item_id": str(paneer_id),    # FK → food_items._id
                            "name":         "Paneer Butter Masala",
                            "quantity":     1,
                            "price":        230.0,
                            "subtotal":     230.0,
                        },
                        {
                            "food_item_id": str(naan_id),      # FK → food_items._id
                            "name":         "Tandoori Butter Naan",
                            "quantity":     2,
                            "price":        45.0,
                            "subtotal":     90.0,
                        },
                    ],
                    "total_amount": 320.0,
                    "status":       "PLACED",
                    "created_at":   datetime.now(timezone.utc),
                },
            ]
            result = orders_collection.insert_many(demo_orders)
            for label, oid in zip(["rohan_order", "priya_order"], result.inserted_ids):
                seeded_order_ids[label] = oid
            print(f"[SEED] Seeded {len(demo_orders)} demo orders with FK links to users + food_items.")
        else:
            for doc in orders_collection.find({}, {"_id": 1, "customer_phone": 1}):
                key = f"{doc.get('customer_phone', 'unk')}_order"
                seeded_order_ids[key] = doc["_id"]

        # ── Step 6: Seed complaints with real FK links ────────────────────────
        #   complaints.user_id  → users._id
        #   complaints.order_id → orders._id
        if complaints_collection.count_documents({}) == 0:
            rohan_order_id = seeded_order_ids.get("rohan_order") or seeded_order_ids.get("9876543210_order")
            priya_order_id = seeded_order_ids.get("priya_order") or seeded_order_ids.get("9123456789_order")

            dummy_complaints = [
                {
                    "customer_name":  "Rohan Sharma",
                    "customer_phone": "9876543210",
                    "issue":          "The Hyderabadi Chicken Biryani was too spicy and slightly cold when delivered.",
                    "status":         "OPEN",
                    "created_at":     datetime.now(timezone.utc),
                    # FK references stored as ObjectId in MongoDB
                    "user_id":  demo_users.get("9876543210"),   # → users._id
                    "order_id": rohan_order_id,                  # → orders._id
                },
                {
                    "customer_name":  "Priya Patel",
                    "customer_phone": "9123456789",
                    "issue":          "Paneer Butter Masala had fewer paneer pieces than usual.",
                    "status":         "RESOLVED",
                    "created_at":     datetime.now(timezone.utc),
                    # FK references stored as ObjectId in MongoDB
                    "user_id":  demo_users.get("9123456789"),   # → users._id
                    "order_id": priya_order_id,                  # → orders._id
                },
            ]
            complaints_collection.insert_many(dummy_complaints)
            print("[SEED] Seeded 2 complaints with FK links to users + orders.")
        else:
            print(f"[INFO] Skipping DB seed because ENVIRONMENT={settings.ENVIRONMENT} and SEED_DB is not true.")

        # ── Initialize FastAPI Cache ───────────────────────────────────────────
        FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")

    except Exception as e:
        print(f"[WARN] Startup init note: {e}")

    yield

app = FastAPI(
    title="Single Restaurant Ordering API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(users.router)
app.include_router(password_reset.router)


from .models.schemas import UserOut
from .core.security import get_current_user

@app.get("/")
def root():
    return {
        "status": "online",
        "message": "Restaurant Food Ordering API is running.",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "database": settings.DATABASE_NAME}
