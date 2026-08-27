from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime, timezone
from bson import ObjectId
from ..models.schemas import OrderCreate, OrderOut, OrderItemDetail, OrderStatusUpdate, StatisticsOut
from ..database import orders_collection, food_items_collection
from ..core.security import get_current_user, get_current_admin

router = APIRouter(tags=["Orders"])

def doc_to_order(doc: dict) -> OrderOut:
    return OrderOut(
        id=str(doc["_id"]),
        user_id=str(doc["user_id"]),
        customer_name=doc.get("customer_name", ""),
        customer_phone=doc.get("customer_phone", ""),
        address=doc.get("address", ""),
        items=[
            OrderItemDetail(
                food_item_id=str(it.get("food_item_id")),
                name=it.get("name", ""),
                quantity=int(it.get("quantity", 1)),
                price=float(it.get("price", 0)),
                subtotal=float(it.get("subtotal", it.get("price", 0) * it.get("quantity", 1)))
            )
            for it in doc.get("items", [])
        ],
        total_amount=float(doc.get("total_amount", 0)),
        status=doc.get("status", "PLACED"),
        created_at=doc.get("created_at", datetime.now(timezone.utc)),
    )

# --- Customer Endpoints ---

@router.post("/api/orders", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def place_order(order_in: OrderCreate, current_user: dict = Depends(get_current_user)):
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    order_items = []
    total_amount = 0.0

    for item in order_in.items:
        try:
            food_doc = food_items_collection.find_one({"_id": ObjectId(item.food_item_id)})
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid food item id: {item.food_item_id}")

        if not food_doc:
            raise HTTPException(status_code=404, detail=f"Food item not found: {item.food_item_id}")
        
        is_avail = food_doc.get("is_available")
        if is_avail is None:
            is_avail = food_doc.get("available", True)
        if not is_avail:
            raise HTTPException(status_code=400, detail=f"{food_doc.get('name')} is currently unavailable")

        price = float(food_doc["price"])
        qty = int(item.quantity)
        subtotal = price * qty
        total_amount += subtotal

        order_items.append({
            "food_item_id": str(food_doc["_id"]),
            "name": food_doc["name"],
            "quantity": qty,
            "price": price,
            "subtotal": subtotal
        })

    order_doc = {
        "user_id": str(current_user["id"]),
        "customer_name": current_user.get("name", "Customer"),
        "customer_phone": current_user.get("phone", ""),
        "address": order_in.address.strip(),
        "items": order_items,
        "total_amount": round(total_amount, 2),
        "status": "PLACED",
        "created_at": datetime.now(timezone.utc),
    }

    result = orders_collection.insert_one(order_doc)
    order_doc["_id"] = result.inserted_id

    return doc_to_order(order_doc)

@router.get("/api/orders", response_model=List[OrderOut])
@router.get("/api/orders/", response_model=List[OrderOut])
def get_customer_orders(current_user: dict = Depends(get_current_user)):
    cursor = orders_collection.find({"user_id": str(current_user["id"])}).sort("created_at", -1)
    return [doc_to_order(doc) for doc in cursor]

@router.get("/api/orders/{order_id}", response_model=OrderOut)
def get_order_by_id(order_id: str, current_user: dict = Depends(get_current_user)):
    try:
        obj_id = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order ID")

    order_doc = orders_collection.find_one({"_id": obj_id})
    if not order_doc:
        raise HTTPException(status_code=404, detail="Order not found")

    # Only allow owner or admin
    if order_doc["user_id"] != str(current_user["id"]) and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    return doc_to_order(order_doc)

# --- Admin Endpoints ---

@router.get("/api/admin/orders", response_model=List[OrderOut])
def get_all_orders_admin(admin: dict = Depends(get_current_admin)):
    cursor = orders_collection.find().sort("created_at", -1)
    return [doc_to_order(doc) for doc in cursor]

@router.get("/api/admin/statistics", response_model=StatisticsOut)
def get_admin_statistics(
    start_date: str = None,
    end_date: str = None,
    admin: dict = Depends(get_current_admin)
):
    query = {}
    
    if start_date or end_date:
        query["created_at"] = {}
        if start_date:
            try:
                dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                query["created_at"]["$gte"] = dt
            except ValueError:
                pass
        if end_date:
            try:
                dt = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
                query["created_at"]["$lte"] = dt
            except ValueError:
                pass
        
        if not query["created_at"]:
            del query["created_at"]

    query["status"] = {"$nin": ["CANCELLED", "REJECTED"]}

    cursor = orders_collection.find(query)
    total_revenue = 0.0
    total_orders = 0
    
    for doc in cursor:
        total_orders += 1
        total_revenue += float(doc.get("total_amount", 0))

    return StatisticsOut(
        total_revenue=round(total_revenue, 2),
        total_orders=total_orders,
        start_date=start_date,
        end_date=end_date
    )

@router.put("/api/admin/orders/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: str,
    status_in: OrderStatusUpdate,
    admin: dict = Depends(get_current_admin)
):
    try:
        obj_id = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order ID")

    valid_statuses = ["PLACED", "ACCEPTED", "REJECTED", "PREPARING", "READY", "DELIVERED", "CANCELLED"]
    new_status = status_in.status.strip().upper()
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of {valid_statuses}"
        )

    updated_doc = orders_collection.find_one_and_update(
        {"_id": obj_id},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}},
        return_document=True
    )
    if not updated_doc:
        raise HTTPException(status_code=404, detail="Order not found")

    return doc_to_order(updated_doc)

@router.get("/api/admin/orders/{order_id}", response_model=OrderOut)
def admin_get_order(order_id: str, admin: dict = Depends(get_current_admin)):
    try:
        obj_id = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order ID")
    doc = orders_collection.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return doc_to_order(doc)

@router.delete("/api/admin/orders/{order_id}")
def admin_delete_order(order_id: str, admin: dict = Depends(get_current_admin)):
    try:
        obj_id = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order ID")
    result = orders_collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted successfully"}

@router.delete("/api/orders/{order_id}")
def cancel_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Customer can cancel their own PLACED order."""
    try:
        obj_id = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order ID")
    doc = orders_collection.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    if doc["user_id"] != str(current_user["id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    if doc.get("status") not in ["PLACED"]:
        raise HTTPException(status_code=400, detail="Only PLACED orders can be cancelled")
    orders_collection.update_one({"_id": obj_id}, {"$set": {"status": "CANCELLED", "updated_at": datetime.now(timezone.utc)}})
    return {"message": "Order cancelled successfully"}

# --- Complaints Endpoints ---
from ..database import complaints_collection
from ..models.schemas import ComplaintCreate, ComplaintOut


def doc_to_complaint(doc: dict) -> ComplaintOut:
    """Convert a MongoDB complaint document to a ComplaintOut schema."""
    return ComplaintOut(
        id=str(doc["_id"]),
        customer_name=doc.get("customer_name", "Anonymous"),
        customer_phone=doc.get("customer_phone", ""),
        issue=doc.get("issue", ""),
        status=doc.get("status", "OPEN"),
        created_at=doc.get("created_at", datetime.now(timezone.utc)),
        # FK references returned as strings (or None if not linked)
        order_id=str(doc["order_id"]) if doc.get("order_id") else None,
        user_id=str(doc["user_id"]) if doc.get("user_id") else None,
    )


@router.get("/api/admin/complaints", response_model=List[ComplaintOut], tags=["Complaints"])
def get_all_complaints_admin(admin: dict = Depends(get_current_admin)):
    cursor = complaints_collection.find().sort("created_at", -1)
    return [doc_to_complaint(doc) for doc in cursor]


@router.get("/api/admin/complaints/{complaint_id}", response_model=ComplaintOut, tags=["Complaints"])
def get_complaint_by_id(complaint_id: str, admin: dict = Depends(get_current_admin)):
    try:
        obj_id = ObjectId(complaint_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid complaint ID")
    doc = complaints_collection.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return doc_to_complaint(doc)


@router.post("/api/complaints", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED, tags=["Complaints"])
def submit_complaint(data: ComplaintCreate):
    """
    Submit a complaint. Optionally link it to a specific order (order_id)
    and/or user (user_id) to establish the FK relationship in MongoDB.
    """
    doc = {
        "customer_name": data.customer_name.strip(),
        "customer_phone": data.customer_phone.strip(),
        "issue": data.issue.strip(),
        "status": "OPEN",
        "created_at": datetime.now(timezone.utc),
        # Store FK references as ObjectId if valid, else None
        "order_id": None,
        "user_id": None,
    }

    # Validate and store order_id FK (→ orders._id)
    if data.order_id:
        try:
            order_oid = ObjectId(data.order_id)
            if orders_collection.find_one({"_id": order_oid}, {"_id": 1}):
                doc["order_id"] = order_oid
            else:
                raise HTTPException(status_code=404, detail=f"Order '{data.order_id}' not found")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid order_id format")

    # Validate and store user_id FK (→ users._id)
    if data.user_id:
        from ..database import users_collection
        try:
            user_oid = ObjectId(data.user_id)
            if users_collection.find_one({"_id": user_oid}, {"_id": 1}):
                doc["user_id"] = user_oid
            else:
                raise HTTPException(status_code=404, detail=f"User '{data.user_id}' not found")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user_id format")

    res = complaints_collection.insert_one(doc)
    doc["_id"] = res.inserted_id
    return doc_to_complaint(doc)


@router.put("/api/admin/complaints/{complaint_id}/resolve", tags=["Complaints"])
def resolve_complaint(complaint_id: str, admin: dict = Depends(get_current_admin)):
    try:
        obj_id = ObjectId(complaint_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid complaint ID")
    updated = complaints_collection.find_one_and_update(
        {"_id": obj_id},
        {"$set": {"status": "RESOLVED"}},
        return_document=True
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {"status": "RESOLVED", "id": complaint_id}


@router.delete("/api/admin/complaints/{complaint_id}", tags=["Complaints"])
def delete_complaint(complaint_id: str, admin: dict = Depends(get_current_admin)):
    try:
        obj_id = ObjectId(complaint_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid complaint ID")
    result = complaints_collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {"message": "Complaint deleted successfully"}
