from fastapi import APIRouter, Depends
from typing import Dict, List, Any
from ..database import orders_collection, food_items_collection, complaints_collection, users_collection
from ..core.security import get_current_admin

from .orders import doc_to_order, doc_to_complaint
from .menu import doc_to_food_item
from .users import doc_to_user

router = APIRouter(tags=["Dashboard (Admin)"])

@router.get("/api/admin/dashboard-sync")
def get_dashboard_sync(admin: dict = Depends(get_current_admin)) -> Dict[str, Any]:
    """
    Fetches orders, menu items, complaints, and users in a single request.
    This drastically reduces connection overhead for the admin dashboard.
    """
    # 1. Fetch Orders
    orders_cursor = orders_collection.find().sort("created_at", -1)
    orders = [doc_to_order(doc).dict() for doc in orders_cursor]

    # 2. Fetch Menu
    menu_cursor = food_items_collection.find()
    menu = [doc_to_food_item(item).dict() for item in menu_cursor]

    # 3. Fetch Complaints
    complaints_cursor = complaints_collection.find().sort("created_at", -1)
    complaints = [doc_to_complaint(doc).dict() for doc in complaints_cursor]

    # 4. Fetch Users
    users_cursor = users_collection.find().sort("_id", -1)
    users = [doc_to_user(doc).dict() for doc in users_cursor]

    return {
        "orders": orders,
        "menu": menu,
        "complaints": complaints,
        "users": users
    }
