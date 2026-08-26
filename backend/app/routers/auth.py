import re
from fastapi import APIRouter, HTTPException, status, Depends, Request
from ..models.schemas import UserRegister, UserOut, Token, ChangePassword, TokenRefreshRequest
from ..database import users_collection
from ..core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token, get_current_user
from bson import ObjectId

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister):
    phone = user_in.phone.strip()
    
    existing = users_collection.find_one({"phone": phone})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered. Please login.",
        )
    
    # Store ONLY password_hash using bcrypt. Never store plain text password.
    user_doc = {
        "name": user_in.name.strip(),
        "phone": phone,
        "password_hash": get_password_hash(user_in.password),
        "role": "customer",
    }
    
    result = users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(data={"sub": user_id, "role": "customer"})
    refresh_token = create_refresh_token(data={"sub": user_id, "role": "customer"})
    
    user_out = UserOut(
        id=user_id,
        name=user_doc["name"],
        phone=user_doc["phone"],
        role="customer"
    )
    
    return Token(access_token=access_token, refresh_token=refresh_token, user=user_out)

@router.post("/login", response_model=Token)
async def login(request: Request):
    phone = ""
    password = ""

    try:
        body = await request.json()
        phone = str(body.get("phone") or body.get("username", "")).strip()
        password = str(body.get("password", ""))
    except Exception:
        form = await request.form()
        phone = str(form.get("phone") or form.get("username", "")).strip()
        password = str(form.get("password", ""))

    # Clean and normalize phone digits
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    if len(digits) == 10:
        phone = digits

    user = users_collection.find_one({"phone": phone})
    
    if not user or not verify_password(password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password",
        )

    if user.get("role") == "blocked":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked. Please contact the restaurant.",
        )
    
    user_id = str(user["_id"])
    role = user.get("role", "customer")
    access_token = create_access_token(data={"sub": user_id, "role": role})
    refresh_token = create_refresh_token(data={"sub": user_id, "role": role})
    
    user_out = UserOut(
        id=user_id,
        name=user.get("name", ""),
        phone=user.get("phone", ""),
        role=role
    )
    
    return Token(access_token=access_token, refresh_token=refresh_token, user=user_out)

@router.post("/refresh")
def refresh_token(request_data: TokenRefreshRequest):
    try:
        payload = decode_token(request_data.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user_id = payload.get("sub")
        role = payload.get("role", "customer")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        new_access_token = create_access_token(data={"sub": user_id, "role": role})
        return {"access_token": new_access_token}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.get("/me", response_model=UserOut)
def get_me(current_user: dict = Depends(get_current_user)):
    return UserOut(
        id=current_user["id"],
        name=current_user["name"],
        phone=current_user["phone"],
        role=current_user.get("role", "customer")
    )

@router.put("/change-password")
def change_password(payload: ChangePassword, current_user: dict = Depends(get_current_user)):
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

    new_hash = get_password_hash(payload.new_password)
    users_collection.update_one({"_id": obj_id}, {"$set": {"password_hash": new_hash}})

    return {"message": "Password changed successfully"}
