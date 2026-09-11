from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# ------------------------------------------------------------------------------
# Auth Schemas
# ------------------------------------------------------------------------------
class LoginRequest(BaseModel):
    user_id: str
    password: str

class OfficerProfile(BaseModel):
    user_id: str
    full_name: str
    designation: str
    department: str
    terminal: str
    role: str
    status: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: OfficerProfile

# ------------------------------------------------------------------------------
# OCR Schemas (Module 1)
# ------------------------------------------------------------------------------
class OCRFields(BaseModel):
    full_name: Optional[str] = None
    document_number: Optional[str] = None
    nationality: Optional[str] = None
    date_of_birth: Optional[str] = None
    date_of_expiry: Optional[str] = None
    gender: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None

class OCRResult(BaseModel):
    raw_text: str = ""
    fields: OCRFields = Field(default_factory=OCRFields)
    confidence: float = 0.0
    engine: str = "PaddleOCR"
    mrz_detected: bool = False
    mrz_raw: Optional[str] = None

# ------------------------------------------------------------------------------
# Validation Schemas (Module 2)
# ------------------------------------------------------------------------------
class ValidationResult(BaseModel):
    status: str = "VALID"  # VALID, INVALID, EXPIRED, INCOMPLETE, SUSPICIOUS
    checks: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

# ------------------------------------------------------------------------------
# Tampering Detection Schemas (Module 3)
# ------------------------------------------------------------------------------
class TamperingResult(BaseModel):
    tampering_detected: bool = False
    tampering_score: float = 0.0  # 0 to 100
    confidence: float = 0.0
    regions: List[str] = Field(default_factory=list)
    method: str = "OpenCV (ELA + Gradient Variance)"
    details: Optional[Dict[str, Any]] = None

# ------------------------------------------------------------------------------
# Face Verification Schemas (Module 4)
# ------------------------------------------------------------------------------
class FaceResult(BaseModel):
    face_detected_document: bool = False
    face_detected_person: bool = False
    match_score: float = 0.0  # 0 to 100%
    match: bool = False
    engine: str = "InsightFace"
    details: Optional[Dict[str, Any]] = None

# ------------------------------------------------------------------------------
# Risk Assessment Schemas (Module 5)
# ------------------------------------------------------------------------------
class RiskResult(BaseModel):
    risk_score: int = 0  # 0 to 100
    risk_level: str = "LOW"  # LOW, MEDIUM, HIGH
    factors: List[str] = Field(default_factory=list)
    breakdown: Optional[Dict[str, float]] = None

# ------------------------------------------------------------------------------
# Full Screening Pipeline Result
# ------------------------------------------------------------------------------
class ScreeningResult(BaseModel):
    verification_id: str
    document_type: str
    document_number: Optional[str] = None
    applicant_name: Optional[str] = None
    final_result: str  # VERIFIED, SUSPICIOUS, FAILED, EXPIRED, NOT VERIFIED
    risk_score: int
    risk_level: str
    ocr: OCRResult
    validation: ValidationResult
    tampering: TamperingResult
    face: FaceResult
    document_hash: str
    verified_by: str
    timestamp: str
    recommendations: List[str] = Field(default_factory=list)

# ------------------------------------------------------------------------------
# Audit Ledger Schemas
# ------------------------------------------------------------------------------
class AuditRecordItem(BaseModel):
    id: Optional[Any] = None
    verification_id: Optional[str] = None
    officer_id: Optional[str] = None
    document_hash: Optional[str] = None
    previous_hash: Optional[str] = None
    current_hash: Optional[str] = None
    action: Optional[str] = None
    created_at: Optional[str] = None

class AuditVerificationResult(BaseModel):
    is_valid: bool
    total_blocks: int
    corrupted_block: Optional[int] = None
    message: str
    algorithm: str = "SHA-256 Hash Chain"

# ------------------------------------------------------------------------------
# Dashboard & Document Schemas
# ------------------------------------------------------------------------------
class DashboardStats(BaseModel):
    total_screenings: int = 0
    verified_count: int = 0
    suspicious_count: int = 0
    failed_count: int = 0
    recent_verifications: List[Dict[str, Any]] = Field(default_factory=list)

class DocumentItem(BaseModel):
    id: Optional[Any] = None
    document_type: str
    document_number: str
    full_name: Optional[str] = None
    nationality: Optional[str] = None
    date_of_birth: Optional[str] = None
    date_of_expiry: Optional[str] = None
    gender: Optional[str] = None
    document_status: Optional[str] = "UNKNOWN"
    document_hash: Optional[str] = None
    created_at: Optional[str] = None

class DemoScenarioItem(BaseModel):
    id: Optional[Any] = None
    scenario_code: Optional[str] = None
    scenario_name: Optional[str] = None
    demo_number: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    applicant_name: Optional[str] = None
    expected_result: Optional[str] = None
    expected_score: Optional[int] = None
    expected_risk: Optional[str] = None
    expected_risk_level: Optional[str] = None
    document_file_path: Optional[str] = None
    person_photo_path: Optional[str] = None
    document_filename: Optional[str] = None
    person_filename: Optional[str] = None
    notes: Optional[str] = None

# ------------------------------------------------------------------------------
# System Health & Diagnostic Schema (Requirement 31)
# ------------------------------------------------------------------------------
class AIModelStatus(BaseModel):
    name: str
    status: str  # "Available" or "Unavailable"
    version: Optional[str] = None
    notes: Optional[str] = None

class SystemHealthStatus(BaseModel):
    status: str
    service: str = "SSB AI Document Screening API"
    models: List[AIModelStatus]
    database: str
    timestamp: str
