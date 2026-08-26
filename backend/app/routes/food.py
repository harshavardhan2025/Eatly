from fastapi import APIRouter
from typing import List

from ..models.food import FoodCreate, FoodResponse
from ..database import db

router = APIRouter(
    prefix="/api/food-items",
    tags=["food"]
)


@router.get("", response_model=List[FoodResponse])
@router.get("/", response_model=List[FoodResponse])
def get_food_items():

    foods = []

    cursor = db.food_items.find(
        {"is_available": True}
    )

    for food in cursor:

        foods.append(
            {
                "id": str(food["_id"]),
                "name": food["name"],
                "description": food.get(
                    "description", ""
                ),
                "price": food["price"],
                "category": food["category"],
                "image_url": food.get(
                    "image_url", ""
                ),
                "is_available": food.get(
                    "is_available", True
                ),
                "is_veg": food.get(
                    "is_veg", True
                ),
            }
        )

    return foods
