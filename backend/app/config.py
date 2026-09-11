import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BACKEND_DIR / "uploads"
MODELS_DIR = BACKEND_DIR / "models"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BACKEND_DIR}/screening.db")

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_SIZE = 15 * 1024 * 1024  # 15 MB
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}

SECRET_KEY = os.getenv("SECRET_KEY", "sih2026-fake-identity-document-screening-secret-key-986d")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
