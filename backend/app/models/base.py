import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="OFFICER")  # ADMIN, OFFICER
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Verification(Base):
    __tablename__ = "verifications"

    id = Column(String(50), primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    document_type = Column(String(50), default="PASSPORT_TD3")
    
    # Files
    original_image_path = Column(String(255), nullable=False)
    processed_image_path = Column(String(255), nullable=True)
    document_face_path = Column(String(255), nullable=True)
    verification_face_path = Column(String(255), nullable=True)
    ela_heatmap_path = Column(String(255), nullable=True)

    # Risk summary
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    reasons = Column(JSON, default=list)

    # Modular data payloads
    preprocessing_result = Column(JSON, default=dict)
    ocr_result = Column(JSON, default=dict)
    mrz_result = Column(JSON, default=dict)
    consistency_result = Column(JSON, default=dict)
    face_result = Column(JSON, default=dict)
    tamper_result = Column(JSON, default=dict)
    morph_result = Column(JSON, default=dict)
    processing_time_seconds = Column(Float, default=0.0)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    username = Column(String(50), nullable=True)
    action = Column(String(50), nullable=False)  # LOGIN, UPLOAD, VERIFICATION, REPORT_EXPORT
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
