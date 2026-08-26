import re
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime

# --- User Schemas ---
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6, max_length=100)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters long.")
        if not re.match(r"^[a-zA-Z\s]+$", v):
            raise ValueError("Name must contain only alphabetic letters and spaces (no numbers or special characters).")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        elif len(digits) == 11 and digits.startswith("0"):
            digits = digits[1:]
            
        if not re.match(r"^[6-9]\d{9}$", digits):
            raise ValueError("Phone number must be a valid 10-digit mobile number starting with 6, 7, 8, or 9.")
        return digits

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        return v

class UserLogin(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        elif len(digits) == 11 and digits.startswith("0"):
            digits = digits[1:]
        return digits if len(digits) == 10 else v.strip()

class UserOut(BaseModel):
    id: str
    name: str
    phone: str
    role: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=100)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("New password must be at least 6 characters long.")
        return v


# --- Food Item Schemas ---
class FoodItemCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = ""
    price: float = Field(..., gt=0)
    category: Optional[str] = "Biryani"
    image_url: Optional[str] = ""
    is_available: bool = True

class FoodItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None

class FoodItemOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    price: float
    category: Optional[str] = "Biryani"
    image_url: Optional[str] = ""
    image: Optional[str] = ""
    is_available: bool = True
    available: bool = True
    liked_by: List[str] = []

# --- Order Schemas ---
class OrderItemIn(BaseModel):
    food_item_id: str
    quantity: int = Field(..., ge=1)

class OrderItemDetail(BaseModel):
    food_item_id: str
    name: str
    quantity: int
    price: float
    subtotal: float

class OrderCreate(BaseModel):
    address: str = Field(..., min_length=5, max_length=500)
    items: List[OrderItemIn] = Field(..., min_length=1)

class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="Status e.g. ACCEPTED, REJECTED, PREPARING, READY, DELIVERED, CANCELLED")

class OrderOut(BaseModel):
    id: str
    user_id: str
    customer_name: str
    customer_phone: str
    address: str
    items: List[OrderItemDetail]
    total_amount: float
    status: str
    created_at: datetime


# --- Complaint Schemas ---
class ComplaintCreate(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_phone: str = Field(..., min_length=10, max_length=15)
    issue: str = Field(..., min_length=5, max_length=1000)
    # Optional FK references — link complaint to a specific order and/or user
    order_id: Optional[str] = Field(None, description="Related order ID (FK → orders._id)")
    user_id: Optional[str] = Field(None, description="Related user ID (FK → users._id)")

class ComplaintOut(BaseModel):
    id: str
    customer_name: str
    customer_phone: str
    issue: str
    status: str
    created_at: datetime
    # FK references exposed in responses
    order_id: Optional[str] = None
    user_id: Optional[str] = None


# --- Admin User Schemas ---
class UserAdminOut(BaseModel):
    id: str
    name: str
    phone: str
    role: str
