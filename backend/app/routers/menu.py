from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from bson import ObjectId
from ..models.schemas import FoodItemCreate, FoodItemUpdate, FoodItemOut
from ..database import food_items_collection
from ..database import food_items_collection
from ..core.security import get_current_admin, get_current_user

router = APIRouter(tags=["Menu / Food Items"])

def doc_to_food_item(doc: dict) -> FoodItemOut:
    img = doc.get("image_url") or doc.get("image") or ""
    avail = doc.get("is_available")
    if avail is None:
        avail = doc.get("available", True)
    return FoodItemOut(
        id=str(doc["_id"]),
        name=doc["name"],
        description=doc.get("description", ""),
        price=float(doc["price"]),
        category=doc.get("category", "Biryani"),
        image_url=str(img),
        image=str(img),
        is_available=bool(avail),
        available=bool(avail),
        liked_by=doc.get("liked_by", []),
    )

# --- Public Endpoints ---

@router.get("/api/food-items", response_model=List[FoodItemOut])
@router.get("/api/food-items/", response_model=List[FoodItemOut])
def get_all_food_items():
    cursor = food_items_collection.find()
    return [doc_to_food_item(item) for item in cursor]

@router.get("/api/food-items/{item_id}", response_model=FoodItemOut)
def get_food_item_by_id(item_id: str):
    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid food item ID")
    doc = food_items_collection.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Food item not found")
    return doc_to_food_item(doc)

@router.post("/api/food-items/{item_id}/like")
def like_food_item(item_id: str, current_user: dict = Depends(get_current_user)):
    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid food item ID")
    
    user_id = str(current_user["_id"])
    result = food_items_collection.update_one(
        {"_id": obj_id},
        {"$addToSet": {"liked_by": user_id}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Food item not found")
    return {"message": "Item liked successfully"}

@router.delete("/api/food-items/{item_id}/like")
def unlike_food_item(item_id: str, current_user: dict = Depends(get_current_user)):
    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid food item ID")
    
    user_id = str(current_user["_id"])
    result = food_items_collection.update_one(
        {"_id": obj_id},
        {"$pull": {"liked_by": user_id}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Food item not found")
    return {"message": "Item unliked successfully"}

# --- Admin Endpoints ---

@router.get("/api/admin/food-items", response_model=List[FoodItemOut])
def admin_get_all_food_items(admin: dict = Depends(get_current_admin)):
    cursor = food_items_collection.find()
    return [doc_to_food_item(item) for item in cursor]

@router.get("/api/admin/food-items/{item_id}", response_model=FoodItemOut)
def admin_get_food_item(item_id: str, admin: dict = Depends(get_current_admin)):
    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid food item ID")
    doc = food_items_collection.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Food item not found")
    return doc_to_food_item(doc)

@router.post("/api/admin/food-items", response_model=FoodItemOut, status_code=status.HTTP_201_CREATED)
def create_food_item(item_in: FoodItemCreate, admin: dict = Depends(get_current_admin)):
    img_val = item_in.image_url.strip() if item_in.image_url else ""
    doc = {
        "name": item_in.name.strip(),
        "description": item_in.description.strip() if item_in.description else "",
        "price": float(item_in.price),
        "category": item_in.category.strip() if item_in.category else "Biryani",
        "image_url": img_val,
        "image": img_val,
        "is_available": item_in.is_available,
        "available": item_in.is_available,
    }
    result = food_items_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc_to_food_item(doc)

@router.put("/api/admin/food-items/{item_id}", response_model=FoodItemOut)
def update_food_item(item_id: str, item_in: FoodItemUpdate, admin: dict = Depends(get_current_admin)):
    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid food item ID")
    
    update_data = {}
    if item_in.name is not None:
        update_data["name"] = item_in.name.strip()
    if item_in.description is not None:
        update_data["description"] = item_in.description.strip()
    if item_in.price is not None:
        update_data["price"] = float(item_in.price)
    if item_in.category is not None:
        update_data["category"] = item_in.category.strip()
    if item_in.image_url is not None:
        img_val = item_in.image_url.strip()
        update_data["image_url"] = img_val
        update_data["image"] = img_val
    if item_in.is_available is not None:
        update_data["is_available"] = item_in.is_available
        update_data["available"] = item_in.is_available

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    result = food_items_collection.find_one_and_update(
        {"_id": obj_id},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Food item not found")

    return doc_to_food_item(result)

@router.delete("/api/admin/food-items/{item_id}")
def delete_food_item(item_id: str, admin: dict = Depends(get_current_admin)):
    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid food item ID")
    
    result = food_items_collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Food item not found")
    
    return {"message": "Food item deleted successfully"}
