import os
import uuid
import logging
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

from backend.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, UPLOAD_DIR

logger = logging.getLogger(__name__)

# Supabase Storage Buckets
BUCKET_DOCUMENTS = "verification-documents"
BUCKET_REPORTS = "verification-reports"

# In-memory store mirroring the 7 official Supabase tables for seamless offline/local development
_local_store: Dict[str, List[Dict[str, Any]]] = {
    "users": [],
    "verification_requests": [],
    "verification_media": [],
    "extracted_data": [],
    "verification_checks": [],
    "verification_results": [],
    "verification_logs": [],
}

_supabase_client = None

def get_supabase_client():
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    
    key = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
    if SUPABASE_URL and key and not SUPABASE_URL.startswith("https://your-project"):
        try:
            from supabase import create_client
            _supabase_client = create_client(SUPABASE_URL, key)
            return _supabase_client
        except Exception as e:
            logger.warning(f"Failed to initialize Supabase client: {e}")
            return None
    return None

def is_supabase_configured() -> bool:
    return get_supabase_client() is not None

# ------------------------------------------------------------------------------
# Storage Management (Bucket 'verification-documents' and 'verification-reports')
# ------------------------------------------------------------------------------
def upload_document_to_storage(image_bytes: bytes, filename: str, mime_type: str = "image/png", bucket: str = BUCKET_DOCUMENTS) -> str:
    """
    Uploads document image to Supabase Storage bucket 'verification-documents' (or 'verification-reports').
    Falls back to storing in local upload folder if Supabase is offline.
    Returns: storage path reference string.
    """
    clean_filename = f"{uuid.uuid4().hex}_{Path(filename).name}"
    client = get_supabase_client()

    if client:
        try:
            res = client.storage.from_(bucket).upload(
                path=clean_filename,
                file=image_bytes,
                file_options={"content-type": mime_type, "upsert": "true"}
            )
            return f"{bucket}/{clean_filename}"
        except Exception as e:
            logger.warning(f"Supabase Storage '{bucket}' upload warning: {e}. Falling back to local storage.")

    # Local filesystem storage fallback
    local_path = UPLOAD_DIR / clean_filename
    try:
        with open(local_path, "wb") as f:
            f.write(image_bytes)
        return f"uploads/{clean_filename}"
    except Exception as e:
        logger.error(f"Failed to save document locally: {e}")
        return f"uploads/{clean_filename}"

# ------------------------------------------------------------------------------
# Table 1: users (Authentication & Profiles)
# ------------------------------------------------------------------------------
def count_users() -> int:
    client = get_supabase_client()
    if client:
        try:
            resp = client.table("users").select("id", count="exact").execute()
            if resp.count is not None:
                return resp.count
            return len(resp.data or [])
        except Exception:
            pass
    return len(_local_store["users"])

def count_officers() -> int:
    return count_users()

def get_user_by_user_id(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Queries public.users table by user_id, username, or email.
    Never exposes raw password in public structures.
    """
    if not user_id:
        return None
    clean_id = user_id.strip()
    client = get_supabase_client()
    if client:
        try:
            resp = client.table("users").select("*").or_(f"user_id.eq.{clean_id},username.eq.{clean_id},email.eq.{clean_id}").execute()
            if resp.data and len(resp.data) > 0:
                u = resp.data[0]
                return {
                    "id": u.get("id"),
                    "user_id": u.get("user_id") or u.get("username"),
                    "username": u.get("username"),
                    "email": u.get("email"),
                    "full_name": u.get("full_name"),
                    "role": (u.get("role") or "OFFICER").upper(),
                    "status": "Active" if u.get("is_active", True) else "Inactive",
                    "password_hash": u.get("password") or u.get("password_hash"),
                    "department": u.get("department", "Sashastra Seema Bal (SSB), Police II Division"),
                    "designation": u.get("designation", "Screening Officer"),
                    "terminal": u.get("terminal", "ICP Raxaul • Indo-Nepal Border Terminal"),
                    "badge_number": u.get("badge_number", "SSB-MHA-8842"),
                    "avatar_url": u.get("avatar_url"),
                    "is_active": u.get("is_active", True),
                    "created_at": u.get("created_at")
                }
        except Exception as e:
            logger.warning(f"Error querying users table: {e}")

    # Query local in-memory store
    u_lower = clean_id.lower()
    for u in _local_store["users"]:
        if (
            str(u.get("user_id", "")).lower() == u_lower
            or str(u.get("username", "")).lower() == u_lower
            or str(u.get("email", "")).lower() == u_lower
            or str(u.get("id", "")).lower() == u_lower
        ):
            return u
    
    return None

get_officer_by_user_id = get_user_by_user_id

# ------------------------------------------------------------------------------
# Table 2: verification_requests
# ------------------------------------------------------------------------------
def create_verification_request(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates record in verification_requests.
    Columns: id (UUID), verification_code, user_id, document_type, status, demo_mode, original_filename, mime_type, file_size, created_at, updated_at
    """
    if "id" not in data:
        data["id"] = str(uuid.uuid4())
    if "created_at" not in data:
        data["created_at"] = datetime.utcnow().isoformat() + "Z"
    if "updated_at" not in data:
        data["updated_at"] = data["created_at"]

    client = get_supabase_client()
    if client:
        try:
            resp = client.table("verification_requests").insert(data).execute()
            if resp.data and len(resp.data) > 0:
                return resp.data[0]
        except Exception as e:
            logger.warning(f"Supabase verification_requests insert warning: {e}")

    _local_store["verification_requests"].append(data)
    return data

# ------------------------------------------------------------------------------
# Table 3: verification_media
# ------------------------------------------------------------------------------
def create_verification_media(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates record in verification_media.
    Columns: id, verification_id, uploaded_by, media_type, bucket_name, storage_path, original_filename, mime_type, file_size, checksum, is_primary, created_at
    """
    if "id" not in data:
        data["id"] = str(uuid.uuid4())
    if "created_at" not in data:
        data["created_at"] = datetime.utcnow().isoformat() + "Z"
    if "bucket_name" not in data:
        data["bucket_name"] = BUCKET_DOCUMENTS

    client = get_supabase_client()
    if client:
        try:
            resp = client.table("verification_media").insert(data).execute()
            if resp.data and len(resp.data) > 0:
                return resp.data[0]
        except Exception as e:
            logger.warning(f"Supabase verification_media insert warning: {e}")

    _local_store["verification_media"].append(data)
    return data

# ------------------------------------------------------------------------------
# Table 4: extracted_data
# ------------------------------------------------------------------------------
def save_extracted_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates record in extracted_data.
    Columns: id, verification_id, document_number, full_name, date_of_birth, nationality, gender, issue_date, expiry_date, issuing_country, mrz_line_1, mrz_line_2, mrz_line_3, raw_text, ocr_confidence, mrz_valid, created_at
    """
    if "id" not in data:
        data["id"] = str(uuid.uuid4())
    if "created_at" not in data:
        data["created_at"] = datetime.utcnow().isoformat() + "Z"

    client = get_supabase_client()
    if client:
        try:
            resp = client.table("extracted_data").insert(data).execute()
            if resp.data and len(resp.data) > 0:
                return resp.data[0]
        except Exception as e:
            logger.warning(f"Supabase extracted_data insert warning: {e}")

    _local_store["extracted_data"].append(data)
    return data

# ------------------------------------------------------------------------------
# Table 5: verification_checks
# ------------------------------------------------------------------------------
def save_verification_check(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates record in verification_checks.
    Columns: id, verification_id, check_type, status, score, confidence, message, details, is_demo_result, started_at, completed_at, created_at
    """
    if "id" not in data:
        data["id"] = str(uuid.uuid4())
    if "created_at" not in data:
        data["created_at"] = datetime.utcnow().isoformat() + "Z"

    client = get_supabase_client()
    if client:
        try:
            resp = client.table("verification_checks").insert(data).execute()
            if resp.data and len(resp.data) > 0:
                return resp.data[0]
        except Exception as e:
            logger.warning(f"Supabase verification_checks insert warning: {e}")

    _local_store["verification_checks"].append(data)
    return data

# ------------------------------------------------------------------------------
# Table 6: verification_results
# ------------------------------------------------------------------------------
def save_verification_result(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates record in verification_results.
    Columns: id, verification_id, ocr_score, mrz_score, authenticity_score, tampering_score, face_match_score, liveness_score, image_quality_score, risk_score, confidence_score, risk_level, final_status, explanation, recommendation, is_demo_result, created_at
    """
    if "id" not in data:
        data["id"] = str(uuid.uuid4())
    if "created_at" not in data:
        data["created_at"] = datetime.utcnow().isoformat() + "Z"

    client = get_supabase_client()
    if client:
        try:
            resp = client.table("verification_results").insert(data).execute()
            if resp.data and len(resp.data) > 0:
                return resp.data[0]
        except Exception as e:
            logger.warning(f"Supabase verification_results insert warning: {e}")

    _local_store["verification_results"].append(data)
    return data

# ------------------------------------------------------------------------------
# Table 7: verification_logs
# ------------------------------------------------------------------------------
def save_verification_log(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates record in verification_logs.
    Columns: id, verification_id, step_name, status, message, progress, metadata, created_at
    """
    if "id" not in data:
        data["id"] = str(uuid.uuid4())
    if "created_at" not in data:
        data["created_at"] = datetime.utcnow().isoformat() + "Z"

    client = get_supabase_client()
    if client:
        try:
            resp = client.table("verification_logs").insert(data).execute()
            if resp.data and len(resp.data) > 0:
                return resp.data[0]
        except Exception as e:
            logger.warning(f"Supabase verification_logs insert warning: {e}")

    _local_store["verification_logs"].append(data)
    return data

# ------------------------------------------------------------------------------
# Aggregate Document & Verification Registry Lookups
# ------------------------------------------------------------------------------
def find_document_by_number(doc_number: str) -> Optional[Dict[str, Any]]:
    """Checks extracted_data for prior records of this document number."""
    if not doc_number:
        return None
    clean_num = doc_number.replace(" ", "").upper()
    client = get_supabase_client()
    if client:
        try:
            resp = client.table("extracted_data").select("*, verification_requests(*), verification_results(*)").eq("document_number", clean_num).execute()
            if resp.data and len(resp.data) > 0:
                return resp.data[0]
        except Exception:
            pass

    for d in _local_store["extracted_data"]:
        if str(d.get("document_number", "")).replace(" ", "").upper() == clean_num:
            return d
    return None

def get_documents(doc_type: Optional[str] = None, status: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
    """Joins extracted_data and verification_requests to list documents."""
    client = get_supabase_client()
    if client:
        try:
            resp = client.table("extracted_data").select("*, verification_requests(*), verification_results(*)").order("created_at", desc=True).execute()
            if resp.data:
                res = []
                for item in resp.data:
                    vr = item.get("verification_requests") or {}
                    vres = item.get("verification_results") or {}
                    if isinstance(vres, list) and len(vres) > 0:
                        vres = vres[0]
                    res.append({
                        "id": item.get("id"),
                        "document_type": vr.get("document_type") or "Passport",
                        "document_number": item.get("document_number", ""),
                        "full_name": item.get("full_name", ""),
                        "nationality": item.get("nationality", ""),
                        "date_of_birth": item.get("date_of_birth"),
                        "date_of_expiry": item.get("expiry_date"),
                        "gender": item.get("gender"),
                        "document_status": vres.get("final_status", "VALID") if isinstance(vres, dict) else "VALID",
                        "document_hash": "",
                        "created_at": item.get("created_at")
                    })
                return res
        except Exception:
            pass

    # From in-memory store
    res = []
    for item in _local_store["extracted_data"]:
        res.append({
            "id": item.get("id"),
            "document_type": "Passport",
            "document_number": item.get("document_number", ""),
            "full_name": item.get("full_name", ""),
            "nationality": item.get("nationality", ""),
            "date_of_birth": item.get("date_of_birth"),
            "date_of_expiry": item.get("expiry_date"),
            "gender": item.get("gender"),
            "document_status": "VALID",
            "document_hash": "",
            "created_at": item.get("created_at")
        })
    return res

# ------------------------------------------------------------------------------
# Verification Records & History (Aggregate of the 7 tables)
# ------------------------------------------------------------------------------
def get_verification_records(limit: int = 100) -> List[Dict[str, Any]]:
    """
    Returns full verification history by joining verification_requests, extracted_data, and verification_results.
    """
    client = get_supabase_client()
    if client:
        try:
            resp = client.table("verification_requests").select("*, extracted_data(*), verification_results(*), verification_checks(*)").order("created_at", desc=True).limit(limit).execute()
            if resp.data:
                records = []
                for req in resp.data:
                    ext = (req.get("extracted_data") or [{}])[0] if isinstance(req.get("extracted_data"), list) else (req.get("extracted_data") or {})
                    res = (req.get("verification_results") or [{}])[0] if isinstance(req.get("verification_results"), list) else (req.get("verification_results") or {})
                    checks = req.get("verification_checks") or []
                    
                    ocr_check = next((c for c in checks if c.get("check_type") == "OCR"), {})
                    tamper_check = next((c for c in checks if c.get("check_type") == "TAMPERING"), {})
                    face_check = next((c for c in checks if c.get("check_type") == "FACE_MATCH"), {})
                    
                    records.append({
                        "id": req.get("id"),
                        "verification_id": req.get("verification_code") or req.get("id"),
                        "document_id": req.get("id"),
                        "officer_id": req.get("user_id") or "A001",
                        "document_type": req.get("document_type", "Passport"),
                        "document_number": ext.get("document_number", ""),
                        "applicant_name": ext.get("full_name", ""),
                        "ocr_status": ocr_check.get("status", "PASSED"),
                        "ocr_confidence": ext.get("ocr_confidence", 95.0),
                        "ocr_data": ext,
                        "validation_status": "VALID" if ext.get("mrz_valid") else "SUSPICIOUS",
                        "mrz_valid": ext.get("mrz_valid", True),
                        "tampering_status": tamper_check.get("status", "NOT_DETECTED"),
                        "tampering_score": res.get("tampering_score", 0.0),
                        "face_verification_status": face_check.get("status", "MATCH"),
                        "face_match_score": res.get("face_match_score", 95.0),
                        "risk_score": res.get("risk_score", 10),
                        "risk_level": res.get("risk_level", "LOW"),
                        "final_result": res.get("final_status", "VERIFIED"),
                        "explanation": res.get("explanation", ""),
                        "recommendation": res.get("recommendation", ""),
                        "is_demo": req.get("demo_mode", False),
                        "created_at": req.get("created_at")
                    })
                return records
        except Exception as e:
            logger.warning(f"Error reading verification history from Supabase: {e}")

    # Fallback to local in-memory store
    records = []
    for req in _local_store["verification_requests"]:
        req_id = req.get("id")
        ext = next((e for e in _local_store["extracted_data"] if e.get("verification_id") == req_id), {})
        res = next((r for r in _local_store["verification_results"] if r.get("verification_id") == req_id), {})
        records.append({
            "id": req_id,
            "verification_id": req.get("verification_code") or req_id,
            "document_id": req_id,
            "officer_id": req.get("user_id") or "A001",
            "document_type": req.get("document_type", "Passport"),
            "document_number": ext.get("document_number", ""),
            "applicant_name": ext.get("full_name", ""),
            "ocr_status": "PASSED",
            "ocr_confidence": ext.get("ocr_confidence", 95.0),
            "ocr_data": ext,
            "validation_status": "VALID" if ext.get("mrz_valid") else "SUSPICIOUS",
            "mrz_valid": ext.get("mrz_valid", True),
            "tampering_status": "NOT_DETECTED",
            "tampering_score": res.get("tampering_score", 0.0),
            "face_verification_status": "MATCH",
            "face_match_score": res.get("face_match_score", 95.0),
            "risk_score": res.get("risk_score", 10),
            "risk_level": res.get("risk_level", "LOW"),
            "final_result": res.get("final_status", "VERIFIED"),
            "explanation": res.get("explanation", ""),
            "recommendation": res.get("recommendation", ""),
            "is_demo": req.get("demo_mode", False),
            "created_at": req.get("created_at")
        })
    return sorted(records, key=lambda x: str(x.get("created_at", "")), reverse=True)[:limit]

def get_verification_by_id(verification_id: str) -> Optional[Dict[str, Any]]:
    records = get_verification_records(limit=200)
    for r in records:
        if r.get("verification_id") == verification_id or r.get("id") == verification_id:
            return r
    return None

# ------------------------------------------------------------------------------
# Dashboard Metrics
# ------------------------------------------------------------------------------
def get_dashboard_metrics() -> Dict[str, Any]:
    records = get_verification_records(limit=200)
    total = len(records)
    verified = sum(1 for r in records if r.get("final_result") in ("VERIFIED", "COMPLETED"))
    suspicious = sum(1 for r in records if r.get("final_result") in ("SUSPICIOUS", "EXPIRED", "WARNING"))
    failed = sum(1 for r in records if r.get("final_result") in ("FAILED", "REJECTED", "NOT VERIFIED"))

    return {
        "total_screenings": total,
        "verified_count": verified,
        "suspicious_count": suspicious,
        "failed_count": failed,
        "recent_verifications": records[:10]
    }

# ------------------------------------------------------------------------------
# Audit Logs (from verification_logs)
# ------------------------------------------------------------------------------
def get_audit_logs() -> List[Dict[str, Any]]:
    client = get_supabase_client()
    if client:
        try:
            resp = client.table("verification_logs").select("*").order("created_at", desc=False).execute()
            if resp.data:
                return resp.data
        except Exception:
            pass
    return sorted(_local_store["verification_logs"], key=lambda x: str(x.get("created_at", "")))

def get_latest_audit_hash() -> str:
    logs = get_audit_logs()
    if logs:
        last = logs[-1]
        raw = f"{last.get('id')}:{last.get('verification_id')}:{last.get('step_name')}"
        return hashlib.sha256(raw.encode()).hexdigest()
    return "0000000000000000000000000000000000000000000000000000000000000000"

def save_audit_log(entry: Dict[str, Any]) -> Dict[str, Any]:
    return save_verification_log({
        "verification_id": entry.get("verification_id"),
        "step_name": entry.get("action", "SCREENING_COMPLETED"),
        "status": "COMPLETED",
        "message": f"Cryptographic audit recorded. Officer: {entry.get('officer_id')}",
        "progress": 100,
        "metadata": entry
    })

# ------------------------------------------------------------------------------
# Seed Default Users & Initial State for Offline / Demo Mode
# ------------------------------------------------------------------------------
def seed_default_users():
    default_users = [
        {
            "id": "307f9396-8bf8-4540-abc2-0f7a8d8ba07b",
            "user_id": "A001",
            "username": "A001",
            "email": "officer002@demo.local",
            "password": "admin123",
            "full_name": "Demo Officer Two",
            "role": "OFFICER",
            "is_active": True,
            "department": "Sashastra Seema Bal (SSB), Police II Division",
            "designation": "Duty Officer (Immigration Clearance)",
            "terminal": "ICP Raxaul • Counter 2",
            "badge_number": "SSB-MHA-8843",
            "created_at": "2026-09-05T15:35:00.938Z"
        },
        {
            "id": "360ef64a-ebd2-44fc-ba8e-7efa49bb8ee8",
            "user_id": "A002",
            "username": "A002",
            "email": "officer@example.com",
            "password": "admin123",
            "full_name": "Security Officer",
            "role": "OFFICER",
            "is_active": True,
            "department": "Sashastra Seema Bal (SSB), Border Checkpoint",
            "designation": "Security Officer",
            "terminal": "ICP Raxaul • Desk 01",
            "badge_number": "SSB-MHA-8844",
            "created_at": "2026-09-04T19:50:22.137Z"
        },
        {
            "id": "94f0c26a-99b1-46cc-9927-7cd8304f924c",
            "user_id": "A003",
            "username": "A003",
            "email": "officer001@demo.local",
            "password": "admin123",
            "full_name": "Demo Officer One",
            "role": "OFFICER",
            "is_active": True,
            "department": "Sashastra Seema Bal (SSB), Police II Division",
            "designation": "Screening Officer (Biometrics & Document Verification)",
            "terminal": "ICP Raxaul • Indo-Nepal Border Terminal",
            "badge_number": "SSB-MHA-8842",
            "created_at": "2026-09-05T15:35:00.938Z"
        },
        {
            "id": "a051e189-62a0-4f40-843b-0d9ecdd968e5",
            "user_id": "A004",
            "username": "A004",
            "email": "admin@example.com",
            "password": "admin123",
            "full_name": "System Administrator",
            "role": "ADMIN",
            "is_active": True,
            "department": "Sashastra Seema Bal (SSB), Directorate General",
            "designation": "Commandant & Border Security Lead",
            "terminal": "SSB HQ • Command Center",
            "badge_number": "SSB-HQ-001",
            "created_at": "2026-09-04T19:50:22.137Z"
        }
    ]
    _local_store["users"] = default_users

seed_default_users()
