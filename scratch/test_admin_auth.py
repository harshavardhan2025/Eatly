from backend.app.database import users_collection
from backend.app.core.security import create_access_token, decode_token, get_password_hash, verify_password
from bson import ObjectId

def test_admin():
    admin = users_collection.find_one({"phone": "9999999999"})
    print("Admin document in DB:", admin)
    if admin:
        token = create_access_token(data={"sub": str(admin["_id"]), "role": admin.get("role")})
        print("Generated Token:", token)
        decoded = decode_token(token)
        print("Decoded Payload:", decoded)
        
        # Test lookup by ObjectId
        u = users_collection.find_one({"_id": ObjectId(decoded["sub"])})
        print("Lookup by ObjectId:", u)
    else:
        print("Admin user NOT FOUND in database!")

if __name__ == "__main__":
    test_admin()
