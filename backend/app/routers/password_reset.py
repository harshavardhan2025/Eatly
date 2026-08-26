import re
import random
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, constr
from ..database import users_collection
from ..core.security import get_password_hash

router = APIRouter(prefix="/api/auth", tags=["Password Reset"])

class RequestResetPayload(BaseModel):
    phone: str

class ResetPasswordPayload(BaseModel):
    phone: str
    otp: str
    new_password: str

# In a real application, OTPs would be stored in a cache (like Redis) or a dedicated collection with an expiry time (TTL).
# For simplicity, we are storing it in the users collection.
@router.post("/request-reset-otp")
def request_reset_otp(payload: RequestResetPayload):
    phone = payload.phone.strip()
    
    # Clean and normalize phone digits
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    if len(digits) == 10:
        phone = digits

    user = users_collection.find_one({"phone": phone})
    if not user:
        # Returning generic message to avoid leaking user info
        return {"message": "If the phone number is registered, an OTP has been sent."}

    # Generate a random 6-digit OTP
    otp = str(random.randint(100000, 999999))
    
    # Store the OTP in the user document (in a real app, hash it or set TTL)
    users_collection.update_one({"_id": user["_id"]}, {"$set": {"reset_otp": otp}})
    
    # Simulate sending OTP (since there is no SMS provider)
    print(f"--- SIMULATED SMS TO {phone} ---")
    print(f"Your password reset OTP is: {otp}")
    print("---------------------------------")
    
    # Return it in response to make it easy to test
    return {"message": "OTP generated.", "simulated_otp": otp}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordPayload):
    phone = payload.phone.strip()
    
    # Clean and normalize phone digits
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    if len(digits) == 10:
        phone = digits

    user = users_collection.find_one({"phone": phone})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid OTP or phone number")

    stored_otp = user.get("reset_otp")
    if not stored_otp or stored_otp != payload.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # Hash new password
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
    new_hash = get_password_hash(payload.new_password)
    
    # Update password and clear OTP
    users_collection.update_one(
        {"_id": user["_id"]}, 
        {"$set": {"password_hash": new_hash}, "$unset": {"reset_otp": ""}}
    )

    return {"message": "Password reset successfully"}
