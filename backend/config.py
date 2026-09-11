import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env / .env.local if present
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")
load_dotenv(BASE_DIR.parent / ".env.local")

# Server Config
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Google Gemini API Key (Server-Side Only - Never Exposed to Frontend)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Supabase Credentials
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# JWT Auth
JWT_SECRET = os.getenv("JWT_SECRET", "ssb-sih2026-secret-key-replace-in-production-sha256")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))

# Directories
UPLOAD_DIR = BASE_DIR / "uploads"
MODELS_DIR = BASE_DIR / "models"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_SIZE_BYTES = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10")) * 1024 * 1024
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"]
