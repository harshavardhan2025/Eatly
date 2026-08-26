from pydantic import BaseModel, Field
from typing import Optional


class FoodCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float
    category: str
    image_url: Optional[str] = ""
    is_available: bool = True
    is_veg: bool = True


class FoodResponse(FoodCreate):
    id: str
