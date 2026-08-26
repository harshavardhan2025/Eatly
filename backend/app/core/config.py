import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Load .env file if present
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(dotenv_path=env_path)
    except ImportError:
        # Fallback reading .env manually if dotenv is not installed
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ[k.strip()] = v.strip()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Single Restaurant Food Ordering API"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    MONGO_URI: str = os.getenv("MONGODB_URL", os.getenv("MONGO_URI", "mongodb://localhost:27017"))
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "food_ordering")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-restaurant-jwt-key-2026-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.ENVIRONMENT == "production" and self.SECRET_KEY == "super-secret-restaurant-jwt-key-2026-change-in-production":
            raise ValueError("CRITICAL: SECRET_KEY must be changed in production!")

    @property
    def cors_origins(self) -> list:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"
        case_sensitive = True

settings = Settings()
