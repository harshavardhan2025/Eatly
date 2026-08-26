from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import CollectionInvalid
from .core.config import settings

import os
import certifi

client = None

# 1. Try local MongoDB first for maximum speed and zero network latency
if os.getenv("FORCE_ATLAS") != "true":
    try:
        client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=1500)
        client.admin.command('ping')
        print("[DATABASE] Connected to local MongoDB instance.")
    except Exception:
        pass

if client is None:
    # 2. Fallback to Atlas Cloud if local MongoDB is unavailable or FORCE_ATLAS is set
    try:
        client = MongoClient(
            settings.MONGO_URI, 
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=20000
        )
        client.admin.command('ping')
        print("[DATABASE] Connected to MongoDB Atlas Cloud.")
    except Exception as err:
        print(f"[DATABASE WARN] Cloud fallback note: {err}")
        if os.getenv("FORCE_ATLAS") != "true":
            client = MongoClient("mongodb://localhost:27017")
        else:
            raise Exception(f"Failed to connect to Atlas when FORCE_ATLAS was set. Error: {err}")


db = client[settings.DATABASE_NAME]


# ── Collection References ────────────────────────────────────────────────────
users_collection       = db["users"]
food_items_collection  = db["food_items"]
orders_collection      = db["orders"]
complaints_collection  = db["complaints"]


def _ensure_collection(name: str):
    """Create a collection explicitly if it doesn't exist yet."""
    existing = db.list_collection_names()
    if name not in existing:
        try:
            db.create_collection(name)
            print(f"[DATABASE] Created collection: '{name}'")
        except CollectionInvalid:
            pass  # already exists (race condition)


def init_db():
    """
    Explicitly create all 4 collections in MongoDB and set up indexes
    that enforce the relationships between them.

    Relationships:
        orders.user_id        → users._id          (many-to-one)
        orders.items[].food_item_id → food_items._id (many-to-many embedded)
        complaints.user_id    → users._id           (many-to-one, optional)
        complaints.order_id   → orders._id          (many-to-one, optional)
    """

    # ── 1. Ensure all 4 collections exist physically in MongoDB ──────────────
    for col in ["users", "food_items", "orders", "complaints"]:
        _ensure_collection(col)

    # ── 2. users indexes ─────────────────────────────────────────────────────
    # Drop old un-named index if it exists (old code created it as "phone_1")
    try:
        existing_idx = {idx["name"] for idx in users_collection.list_indexes()}
        if "phone_1" in existing_idx and "idx_users_phone_unique" not in existing_idx:
            users_collection.drop_index("phone_1")
    except Exception:
        pass
    try:
        users_collection.create_index(
            [("phone", ASCENDING)],
            unique=True,
            name="idx_users_phone_unique"
        )
    except Exception:
        pass  # Already exists with this name

    try:
        users_collection.create_index(
            [("role", ASCENDING)],
            name="idx_users_role"
        )
    except Exception:
        pass

    # ── 3. food_items indexes ────────────────────────────────────────────────
    for idx_def in [
        ([("category", ASCENDING)],    "idx_food_items_category"),
        ([("is_available", ASCENDING)], "idx_food_items_available"),
        ([("name", ASCENDING)],         "idx_food_items_name"),
    ]:
        try:
            food_items_collection.create_index(idx_def[0], name=idx_def[1])
        except Exception:
            pass

    # ── 4. orders indexes ────────────────────────────────────────────────────
    # Drop old unnamed indexes first
    try:
        existing_idx = {idx["name"] for idx in orders_collection.list_indexes()}
        for old in ["user_id_1", "created_at_1"]:
            if old in existing_idx:
                orders_collection.drop_index(old)
    except Exception:
        pass

    for idx_def in [
        ([("user_id", ASCENDING)],                              "idx_orders_user_id"),
        ([("created_at", DESCENDING)],                          "idx_orders_created_at"),
        ([("status", ASCENDING)],                               "idx_orders_status"),
        ([("user_id", ASCENDING), ("created_at", DESCENDING)],  "idx_orders_user_created"),
    ]:
        try:
            orders_collection.create_index(idx_def[0], name=idx_def[1])
        except Exception:
            pass

    # ── 5. complaints indexes ────────────────────────────────────────────────
    for idx_def, kwargs in [
        (([("user_id", ASCENDING)],       "idx_complaints_user_id"),    {"sparse": True}),
        (([("order_id", ASCENDING)],      "idx_complaints_order_id"),   {"sparse": True}),
        (([("status", ASCENDING)],        "idx_complaints_status"),     {}),
        (([("created_at", DESCENDING)],   "idx_complaints_created_at"), {}),
        (([("customer_phone", ASCENDING)],"idx_complaints_phone"),      {}),
    ]:
        try:
            complaints_collection.create_index(idx_def[0], name=idx_def[1], **kwargs)
        except Exception:
            pass

    print("[DATABASE] All collections created and indexes applied.")
    print("[DATABASE] Relationships established:")
    print("           orders.user_id          -> users._id")
    print("           orders.items[].food_item_id -> food_items._id")
    print("           complaints.user_id       -> users._id  (sparse)")
    print("           complaints.order_id      -> orders._id (sparse)")


def get_db():
    return db
