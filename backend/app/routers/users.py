from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from bson import ObjectId
from ..models.schemas import UserAdminOut, UserRegister, ChangePassword
from ..database import users_collection
from ..core.security import get_current_admin, get_current_user, get_password_hash, verify_password
from pydantic import BaseModel


class UserAdminUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None

router = APIRouter(tags=["Users (Admin)"])


def doc_to_user(doc: dict) -> UserAdminOut:
    return UserAdminOut(
        id=str(doc["_id"]),
        name=doc.get("name", ""),
        phone=doc.get("phone", ""),
        role=doc.get("role", "customer"),
    )


# --- Admin: Full User CRUD ---

@router.get("/api/admin/users", response_model=List[UserAdminOut])
def admin_get_all_users(admin: dict = Depends(get_current_admin)):
    """List all registered users (admin only)."""
    cursor = users_collection.find().sort("_id", -1)
    return [doc_to_user(doc) for doc in cursor]


@router.get("/api/admin/users/{user_id}", response_model=UserAdminOut)
def admin_get_user(user_id: str, admin: dict = Depends(get_current_admin)):
    """Get a single user by ID (admin only)."""
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    doc = users_collection.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return doc_to_user(doc)


@router.post("/api/admin/users", response_model=UserAdminOut, status_code=status.HTTP_201_CREATED)
def admin_create_user(user_in: UserRegister, admin: dict = Depends(get_current_admin)):
    """Create a new user (admin only). Role defaults to 'customer'."""
    phone = user_in.phone.strip()
    if users_collection.find_one({"phone": phone}):
        raise HTTPException(status_code=400, detail="Phone number already registered.")
    doc = {
        "name": user_in.name.strip(),
        "phone": phone,
        "password_hash": get_password_hash(user_in.password),
        "role": "customer",
    }
    result = users_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc_to_user(doc)


@router.put("/api/admin/users/{user_id}", response_model=UserAdminOut)
def admin_update_user(
    user_id: str,
    payload: UserAdminUpdate,
    admin: dict = Depends(get_current_admin)
):
    """Update user name or role (admin only). Body: {name?, role?}"""
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    update_data = {}
    if payload.name:
        update_data["name"] = payload.name.strip()
    if payload.role and payload.role in ["customer", "admin"]:
        update_data["role"] = payload.role

    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update. Allowed: name, role.")

    updated = users_collection.find_one_and_update(
        {"_id": obj_id},
        {"$set": update_data},
        return_document=True
    )
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return doc_to_user(updated)


@router.delete("/api/admin/users/{user_id}")
def admin_delete_user(user_id: str, admin: dict = Depends(get_current_admin)):
    """Delete a user (admin only). Cannot delete yourself."""
    if user_id == str(admin.get("id", admin.get("_id", ""))):
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    result = users_collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


# --- Self-service (current logged-in user) ---

@router.put("/api/users/me/change-password")
def change_my_password(payload: ChangePassword, current_user: dict = Depends(get_current_user)):
    """Change your own password."""
    user_id = current_user["id"]
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = users_collection.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(payload.current_password, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    users_collection.update_one(
        {"_id": obj_id},
        {"$set": {"password_hash": get_password_hash(payload.new_password)}}
    )
    return {"message": "Password changed successfully"}
