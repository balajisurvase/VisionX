import os
from datetime import datetime
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import UPLOAD_DIR, FRONTEND_URL, ENVIRONMENT
from backend.models.schemas import SystemHealthStatus, AIModelStatus, ScreeningResult
from backend.routes.auth import router as auth_router
from backend.routes.verification import router as verification_router, screen_document
from backend.routes.ocr import router as ocr_router
from backend.routes.validation import router as validation_router
from backend.routes.tampering import router as tampering_router
from backend.routes.face import router as face_router
from backend.routes.risk import router as risk_router
from backend.routes.dashboard import router as dashboard_router
from backend.routes.documents import router as documents_router
from backend.routes.history import router as history_router
from backend.routes.audit import router as audit_router
from backend.routes.demo import router as demo_router
from backend.routes.gemini import router as gemini_router
from backend.services.supabase_service import is_supabase_configured
from backend.services.gemini_service import is_gemini_available

app = FastAPI(
    title="AI-Based Fake Identity & Document Screening System",
    description="SIH 2026 Problem Statement 26188 — Sashastra Seema Bal (SSB), Ministry of Home Affairs",
    version="2.0.0"
)

# Production-safe CORS Configuration
origins: List[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if FRONTEND_URL:
    for url in FRONTEND_URL.split(","):
        cleaned = url.strip().rstrip("/")
        if cleaned and cleaned not in origins:
            origins.append(cleaned)

# If in development or no specific FRONTEND_URL provided, permit allow_origins=["*"] safely
if ENVIRONMENT == "development" or not FRONTEND_URL:
    allow_origins_list = ["*"]
else:
    allow_origins_list = origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins_list,
    allow_credentials=True if allow_origins_list != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads and demo documents
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

demo_docs_path = Path(__file__).resolve().parent.parent / "demo_documents"
if demo_docs_path.exists():
    app.mount("/demo_documents", StaticFiles(directory=str(demo_docs_path)), name="demo_documents")

# ------------------------------------------------------------------------------
# API Routes (Single Clean Architecture - No duplicate routers or conflicting prefixes)
# ------------------------------------------------------------------------------

# Primary Verification Pipeline Endpoint
@app.post("/api/verify", response_model=ScreeningResult, tags=["Automated Pipeline"])
async def verify_endpoint(
    file: UploadFile = File(...),
    person_photo: Optional[UploadFile] = File(None),
    document_type: str = Form("Passport"),
    officer_id: str = Form("A001")
):
    """
    Primary endpoint for full-pipeline identity and document screening.
    Directly invokes the 8-stage forensic, OCR, MRZ, tampering, face verification, and risk engine.
    """
    return await screen_document(file=file, person_photo=person_photo, document_type=document_type, officer_id=officer_id)

# Modular Routers
app.include_router(auth_router, prefix="/api")
app.include_router(verification_router, prefix="/api")
app.include_router(ocr_router, prefix="/api")
app.include_router(validation_router, prefix="/api")
app.include_router(tampering_router, prefix="/api")
app.include_router(face_router, prefix="/api")
app.include_router(risk_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(history_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(demo_router, prefix="/api")
app.include_router(gemini_router, prefix="/api")

# ------------------------------------------------------------------------------
# Diagnostic & Health Check
# ------------------------------------------------------------------------------
@app.get("/api/health", response_model=SystemHealthStatus, tags=["Diagnostics"])
def health_check():
    """
    Diagnostic endpoint reporting system status and AI model readiness (Requirement 31).
    Checks Gemini 2.5 Flash, OpenCV, ICAO 9303, and Database status.
    """
    models: list[AIModelStatus] = []

    # 1. Google Gemini 2.5 Flash Multimodal Vision
    if is_gemini_available():
        models.append(AIModelStatus(name="Google Gemini 2.5 Flash", status="Available", version="google-genai 1.0"))
    else:
        models.append(AIModelStatus(
            name="Google Gemini 2.5 Flash",
            status="API Key Missing",
            notes="Set GEMINI_API_KEY in backend/.env or server environment for full multimodal vision"
        ))

    # 2. OpenCV Forensics & Face Cascade
    try:
        import cv2
        models.append(AIModelStatus(name="OpenCV Forensics & Haar Cascade", status="Available", version=cv2.__version__))
    except Exception:
        models.append(AIModelStatus(name="OpenCV", status="Unavailable", notes="Standard image operations active"))

    # 3. ICAO 9303 Checksum Engine
    models.append(AIModelStatus(name="ICAO 9303 Checksum Engine", status="Available", version="Modulo-10 (7-3-1)"))

    # 4. Multi-Factor Sovereign Threat Engine
    models.append(AIModelStatus(name="Sovereign Multi-Factor Threat Matrix", status="Available", version="2.0"))

    # 5. Pillow EXIF & ELA Analyzer
    try:
        import PIL
        models.append(AIModelStatus(name="Pillow EXIF & ELA Forensics", status="Available", version=PIL.__version__))
    except Exception:
        models.append(AIModelStatus(name="Pillow", status="Unavailable"))

    db_status = "Connected (Supabase PostgreSQL & Storage)" if is_supabase_configured() else "Local Mode"

    return SystemHealthStatus(
        status="healthy",
        service="SSB AI Document Screening API",
        models=models,
        database=db_status,
        timestamp=datetime.utcnow().isoformat() + "Z"
    )
