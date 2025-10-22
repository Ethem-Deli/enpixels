import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Product API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app/backend/db/products.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey")
    ALGORITHM: str = "HS256"

settings = Settings()
