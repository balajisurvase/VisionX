import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import UPLOAD_DIR, MODELS_DIR
from backend.app.schemas.document import HealthStatusResponse
from backend.app.api.documents import router as documents_router

app = FastAPI(
    title="AI-Based Fake Identity & Document Screening API",
    description="Backend services for Problem Statement 26188: Automated Document Verification, Preprocessing, MRZ, OCR, Face Matching, Tampering, and Risk Scoring.",
    version="1.0.0"
)

# CORS middleware for local frontend and production domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static asset delivery
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include API routers
app.include_router(documents_router, prefix="/api")


@app.get("/api/health", response_model=HealthStatusResponse)
def health_check():
    """System health check and diagnostic inspection."""
    tesseract_available = False
    try:
        import pytesseract
        _ = pytesseract.get_tesseract_version()
        tesseract_available = True
    except Exception:
        tesseract_available = False

    yunet_path = MODELS_DIR / "face_detection_yunet_2023mar.onnx"
    sface_path = MODELS_DIR / "face_recognition_sface_2021dec.onnx"
    opencv_models_ready = yunet_path.exists() and sface_path.exists()

    return HealthStatusResponse(
        status="healthy",
        service="document-screening-backend",
        version="1.0.0",
        modules_loaded=["Module 1: Document Upload & Preprocessing"],
        tesseract_available=tesseract_available,
        opencv_models_ready=opencv_models_ready
    )
