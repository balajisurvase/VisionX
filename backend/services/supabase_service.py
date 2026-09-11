import os
import uuid
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

from backend.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, UPLOAD_DIR

logger = logging.getLogger(__name__)

# In-memory fallback store when Supabase environment variables are not configured
_local_store: Dict[str, List[Dict[str, Any]]] = {
    "officers": [],
    "documents": [],
    "verification_records": [],
    "audit_logs": [],
    "demo_scenarios": [],
    "blacklist": []
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
# Storage Management (Supabase Storage bucket 'documents' with local fallback)
# ------------------------------------------------------------------------------
def upload_document_to_storage(image_bytes: bytes, filename: str, mime_type: str = "image/png") -> str:
    """
    Uploads document image to Supabase Storage bucket 'documents'.
    Falls back to storing in local upload folder if Supabase is offline.
    Returns: storage path reference string.
    """
    clean_filename = f"{uuid.uuid4().hex}_{Path(filename).name}"
    client = get_supabase_client()

    if client:
        try:
            # Check or upload to 'documents' bucket
            res = client.storage.from_("documents").upload(
                path=clean_filename,
                file=image_bytes,
                file_options={"content-type": mime_type, "upsert": "true"}
            )
            return f"documents/{clean_filename}"
        except Exception as e:
            logger.warning(f"Supabase Storage upload warning: {e}. Falling back to local storage.")

    # Local filesystem storage
    local_path = UPLOAD_DIR / clean_filename
    try:
        with open(local_path, "wb") as f:
            f.write(image_bytes)
        return f"uploads/{clean_filename}"
    except Exception as e:
        logger.error(f"Failed to save document locally: {e}")
        return f"uploads/{clean_filename}"

# ------------------------------------------------------------------------------
# Officers
# ------------------------------------------------------------------------------
def count_officers() -> int:
    client = get_supabase_client()
    if client:
        try:
            resp_users = client.table("users").select("id", count="exact").execute()
            if resp_users.count is not None and resp_users.count > 0:
                return resp_users.count
            resp = client.table("officers").select("id", count="exact").execute()
            if resp.count is not None:
                return resp.count
            return len(resp.data or [])
        except Exception:
            pass
    return len(_local_store["officers"])

def get_officer_by_user_id(user_id: str) -> Optional[Dict[str, Any]]:
    client = get_supabase_client()
    if client:
        try:
            # 1. Query public.users table by user_id, username, or email
            resp_users = client.table("users").select("*").or_(f"user_id.eq.{user_id},username.eq.{user_id},email.eq.{user_id}").execute()
            if resp_users.data and len(resp_users.data) > 0:
                u = resp_users.data[0]
                return {
                    "id": u.get("id"),
                    "user_id": u.get("user_id") or u.get("username"),
                    "username": u.get("username"),
                    "email": u.get("email"),
                    "full_name": u.get("full_name"),
                    "role": (u.get("role") or "officer").lower(),
                    "status": "active",
                    "password_hash": u.get("password") or u.get("password_hash"),
                }
            # 2. Query public.officers table
            resp = client.table("officers").select("*").eq("user_id", user_id).execute()
            if resp.data and len(resp.data) > 0:
                return resp.data[0]
        except Exception:
            pass

    u_lower = user_id.lower()
    for off in _local_store["officers"]:
        if (
            off.get("user_id", "").lower() == u_lower
            or off.get("username", "").lower() == u_lower
            or off.get("email", "").lower() == u_lower
            or off.get("id", "").lower() == u_lower
        ):
            return off
    
    return None

# ------------------------------------------------------------------------------
# Documents
# ------------------------------------------------------------------------------
def get_documents(doc_type: Optional[str] = None, status: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    if client:
        try:
            query = client.table("documents").select("*")
            if doc_type:
                query = query.eq("document_type", doc_type)
            if status:
                query = query.eq("document_status", status)
            if search:
                query = query.ilike("document_number", f"%{search}%")
            resp = query.order("created_at", desc=True).execute()
            return resp.data or []
        except Exception:
            return []

    results = _local_store["documents"]
    if doc_type:
        results = [d for d in results if d.get("document_type") == doc_type]
    if status:
        results = [d for d in results if d.get("document_status") == status]
    if search:
        s_lower = search.lower()
        results = [d for d in results if s_lower in d.get("document_number", "").lower() or s_lower in d.get("full_name", "").lower()]
    return sorted(results, key=lambda x: str(x.get("created_at", "")), reverse=True)

def find_document_by_number(doc_number: str) -> Optional[Dict[str, Any]]:
    if not doc_number:
        return None
    clean_num = doc_number.replace(" ", "").upper()
    client = get_supabase_client()
    if client:
        try:
            resp = client.table("documents").select("*").eq("document_number", clean_num).execute()
            if resp.data and len(resp.data) > 0:
                return resp.data[0]
        except Exception:
            pass

    for d in _local_store["documents"]:
        if d.get("document_number", "").replace(" ", "").upper() == clean_num:
            return d
    return None

def save_document_record(doc_data: Dict[str, Any]) -> Dict[str, Any]:
    client = get_supabase_client()
    if client:
        try:
            resp = client.table("documents").upsert(doc_data).execute()
            if resp.data and len(resp.data) > 0:
                return resp.data[0]
        except Exception:
            pass

    for idx, d in enumerate(_local_store["documents"]):
        if d.get("document_number") == doc_data.get("document_number"):
            _local_store["documents"][idx] = doc_data
            return doc_data
    _local_store["documents"].append(doc_data)
    return doc_data

save_document = save_document_record

# ------------------------------------------------------------------------------
# Blacklist & Sovereign Watchlist
# ------------------------------------------------------------------------------
def check_blacklist(document_number: str, full_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Checks sovereign blacklist table for matched document number or suspect name."""
    if not document_number and not full_name:
        return None

    clean_doc = document_number.replace(" ", "").upper() if document_number else ""
    clean_name = full_name.strip().upper() if full_name else ""

    client = get_supabase_client()
    if client:
        try:
            if clean_doc:
                resp = client.table("blacklist").select("*").eq("document_number", clean_doc).eq("is_active", True).execute()
                if resp.data and len(resp.data) > 0:
                    return resp.data[0]
            if clean_name:
                resp = client.table("blacklist").select("*").ilike("full_name", clean_name).eq("is_active", True).execute()
                if resp.data and len(resp.data) > 0:
                    return resp.data[0]
        except Exception:
            pass

    for blk in _local_store["blacklist"]:
        if not blk.get("is_active", True):
            continue
        if clean_doc and blk.get("document_number", "").replace(" ", "").upper() == clean_doc:
            return blk
        if clean_name and blk.get("full_name", "").strip().upper() == clean_name:
            return blk

    return None

# ------------------------------------------------------------------------------
# Cross-Identity Discrepancy Finder
# ------------------------------------------------------------------------------
def find_cross_identity_discrepancy(full_name: str, dob: str, current_doc_number: str) -> Optional[Dict[str, Any]]:
    """Identifies if the same individual (Name/DOB) previously appeared with a different document number."""
    if not full_name or not current_doc_number:
        return None

    clean_name = full_name.strip().upper()
    clean_doc = current_doc_number.replace(" ", "").upper()

    client = get_supabase_client()
    if client:
        try:
            resp = client.table("documents").select("*").ilike("full_name", clean_name).neq("document_number", clean_doc).execute()
            if resp.data and len(resp.data) > 0:
                return resp.data[0]
        except Exception:
            pass

    for doc in _local_store["documents"]:
        if doc.get("full_name", "").strip().upper() == clean_name and doc.get("document_number", "").replace(" ", "").upper() != clean_doc:
            return doc

    return None

# ------------------------------------------------------------------------------
# Verification Records
# ------------------------------------------------------------------------------
def get_verification_records(limit: int = 50) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    if client:
        try:
            resp = client.table("verification_records").select("*").order("created_at", desc=True).limit(limit).execute()
            return resp.data or []
        except Exception:
            return []

    return sorted(_local_store["verification_records"], key=lambda x: str(x.get("created_at", "")), reverse=True)[:limit]

def get_verification_by_id(verification_id: str) -> Optional[Dict[str, Any]]:
    client = get_supabase_client()
    if client:
        try:
            resp = client.table("verification_records").select("*").eq("verification_id", verification_id).execute()
            if resp.data and len(resp.data) > 0:
                return resp.data[0]
        except Exception:
            pass

    for r in _local_store["verification_records"]:
        if r.get("verification_id") == verification_id or r.get("id") == verification_id:
            return r
    return None

def save_verification_record(record: Dict[str, Any]) -> Dict[str, Any]:
    client = get_supabase_client()
    if client:
        try:
            resp = client.table("verification_records").insert(record).execute()
            if resp.data and len(resp.data) > 0:
                return resp.data[0]
        except Exception:
            pass

    _local_store["verification_records"].append(record)
    return record

# ------------------------------------------------------------------------------
# Audit Logs
# ------------------------------------------------------------------------------
def get_audit_logs() -> List[Dict[str, Any]]:
    client = get_supabase_client()
    if client:
        try:
            resp = client.table("audit_logs").select("*").order("created_at", desc=False).execute()
            return resp.data or []
        except Exception:
            return []

    return sorted(_local_store["audit_logs"], key=lambda x: str(x.get("created_at", "")))

def get_latest_audit_hash() -> str:
    logs = get_audit_logs()
    if logs:
        return logs[-1].get("current_hash", "0000000000000000000000000000000000000000000000000000000000000000")
    return "0000000000000000000000000000000000000000000000000000000000000000"

def save_audit_log(entry: Dict[str, Any]) -> Dict[str, Any]:
    client = get_supabase_client()
    if client:
        try:
            resp = client.table("audit_logs").insert(entry).execute()
            if resp.data and len(resp.data) > 0:
                return resp.data[0]
        except Exception:
            pass

    _local_store["audit_logs"].append(entry)
    return entry

# ------------------------------------------------------------------------------
# Demo Scenarios
# ------------------------------------------------------------------------------
def get_demo_scenarios() -> List[Dict[str, Any]]:
    client = get_supabase_client()
    if client:
        try:
            resp = client.table("demo_scenarios").select("*, documents(*)").order("scenario_code", desc=False).execute()
            scenarios = resp.data or []
            for sc in scenarios:
                doc = sc.get("documents") or {}
                if isinstance(doc, dict) and doc:
                    if not sc.get("document_number"):
                        sc["document_number"] = doc.get("document_number")
                    if not sc.get("document_type"):
                        sc["document_type"] = doc.get("document_type")
                    if not sc.get("full_name"):
                        sc["full_name"] = doc.get("full_name")
                    if not sc.get("nationality"):
                        sc["nationality"] = doc.get("nationality")
                    if not sc.get("date_of_birth"):
                        sc["date_of_birth"] = str(doc.get("date_of_birth", ""))
                    if not sc.get("date_of_expiry"):
                        sc["date_of_expiry"] = str(doc.get("date_of_expiry", ""))
            return scenarios
        except Exception:
            return []

    return sorted(_local_store["demo_scenarios"], key=lambda x: str(x.get("scenario_code", "")))

# ------------------------------------------------------------------------------
# Dashboard Metrics
# ------------------------------------------------------------------------------
def get_dashboard_metrics() -> Dict[str, Any]:
    records = get_verification_records(limit=200)
    total = len(records)
    verified = sum(1 for r in records if r.get("final_result") == "VERIFIED")
    suspicious = sum(1 for r in records if r.get("final_result") in ("SUSPICIOUS", "EXPIRED"))
    failed = sum(1 for r in records if r.get("final_result") in ("FAILED", "NOT VERIFIED"))

    return {
        "total_screenings": total,
        "verified_count": verified,
        "suspicious_count": suspicious,
        "failed_count": failed,
        "recent_verifications": records[:10]
    }

# ------------------------------------------------------------------------------
# Database Seeder for Local / Sandbox Mode
# ------------------------------------------------------------------------------
def seed_local_store_from_sql() -> int:
    """
    Seeds local in-memory store from the initial dataset if Supabase is unconfigured.
    """
    import bcrypt

    # 1. Seed Real Officers with Bcrypt Hashes
    salt = bcrypt.gensalt(12)
    pwd_hash_officer = bcrypt.hashpw(b"Officer@123", salt).decode("utf-8")
    pwd_hash_admin = bcrypt.hashpw(b"Admin@123", salt).decode("utf-8")
    pwd_hash_demo = bcrypt.hashpw(b"Demo@123", salt).decode("utf-8")
    pwd_hash_admin123 = bcrypt.hashpw(b"admin123", salt).decode("utf-8")
    
    officer_1_id = str(uuid.uuid4())
    admin_1_id = str(uuid.uuid4())
    demo_officer_id = str(uuid.uuid4())
    
    officers = [
        {
            "id": "307f9396-8bf8-4540-abc2-0f7a8d8ba07b",
            "user_id": "A001",
            "username": "A001",
            "email": "officer002@demo.local",
            "password_hash": pwd_hash_admin123,
            "full_name": "Demo Officer Two",
            "role": "officer",
            "status": "active",
            "is_demo": False,
            "department": "Sashastra Seema Bal (SSB), Police II Division",
            "designation": "Duty Officer (Immigration Clearance)",
            "terminal": "ICP Raxaul • Counter 2",
            "created_at": "2026-09-05T15:35:00.938Z"
        },
        {
            "id": "360ef64a-ebd2-44fc-ba8e-7efa49bb8ee8",
            "user_id": "A002",
            "username": "A002",
            "email": "officer@example.com",
            "password_hash": pwd_hash_admin123,
            "full_name": "Security Officer",
            "role": "officer",
            "status": "active",
            "is_demo": False,
            "department": "Sashastra Seema Bal (SSB), Border Checkpoint",
            "designation": "Security Officer",
            "terminal": "ICP Raxaul • Desk 01",
            "created_at": "2026-09-04T19:50:22.137Z"
        },
        {
            "id": "94f0c26a-99b1-46cc-9927-7cd8304f924c",
            "user_id": "A003",
            "username": "A003",
            "email": "officer001@demo.local",
            "password_hash": pwd_hash_admin123,
            "full_name": "Demo Officer One",
            "role": "officer",
            "status": "active",
            "is_demo": False,
            "department": "Sashastra Seema Bal (SSB), Police II Division",
            "designation": "Screening Officer (Biometrics & Document Verification)",
            "terminal": "ICP Raxaul • Indo-Nepal Border Terminal",
            "created_at": "2026-09-05T15:35:00.938Z"
        },
        {
            "id": "a051e189-62a0-4f40-843b-0d9ecdd968e5",
            "user_id": "A004",
            "username": "A004",
            "email": "admin@example.com",
            "password_hash": pwd_hash_admin123,
            "full_name": "System Administrator",
            "role": "admin",
            "status": "active",
            "is_demo": False,
            "department": "Sashastra Seema Bal (SSB), Directorate General",
            "designation": "Commandant & Border Security Lead",
            "terminal": "SSB HQ • Command Center",
            "created_at": "2026-09-04T19:50:22.137Z"
        },
        {
            "id": officer_1_id,
            "user_id": "officer001",
            "password_hash": pwd_hash_officer,
            "full_name": "Inspector Rajeshwar Kumar",
            "role": "officer",
            "status": "active",
            "is_demo": False,
            "department": "Sashastra Seema Bal (SSB), Police II Division",
            "designation": "Screening Officer",
            "terminal": "ICP Raxaul • Indo-Nepal Border Terminal",
            "reference_photo_path": "demo_documents/person_aarav_reference.svg",
            "created_at": "2026-09-01T00:00:00Z"
        },
        {
            "id": admin_1_id,
            "user_id": "admin01",
            "password_hash": pwd_hash_admin,
            "full_name": "Commander Vikramaditya Singh",
            "role": "admin",
            "status": "active",
            "is_demo": False,
            "department": "Sashastra Seema Bal (SSB), Ministry of Home Affairs",
            "designation": "Commandant & Security Lead",
            "terminal": "ICP Raxaul • HQ Directorate",
            "reference_photo_path": "demo_documents/person_aarav_reference.svg",
            "created_at": "2026-09-01T00:00:00Z"
        },
        {
            "id": demo_officer_id,
            "user_id": "demo_officer",
            "password_hash": pwd_hash_demo,
            "full_name": "Demo Duty Officer",
            "role": "officer",
            "status": "active",
            "is_demo": True,
            "department": "Sashastra Seema Bal (SSB), Police II Division",
            "designation": "Screening Officer",
            "terminal": "ICP Raxaul • Indo-Nepal Border Terminal",
            "reference_photo_path": "demo_documents/person_aarav_reference.svg",
            "created_at": "2026-09-01T00:00:00Z"
        }
    ]
    _local_store["officers"] = officers

    # 2. Blacklist / Sovereign Watchlist
    _local_store["blacklist"] = [
        {
            "id": str(uuid.uuid4()),
            "document_number": "DEMO-BLK-999",
            "full_name": "SUSPECT WANTED PERSON",
            "nationality": "IND",
            "reason": "Red Corner Notice / Cross-Border Contraband Smuggling",
            "severity": "CRITICAL",
            "issuing_agency": "INTERPOL / SSB Intelligence Bureau",
            "is_active": True,
            "added_at": "2026-09-01T00:00:00Z"
        },
        {
            "id": str(uuid.uuid4()),
            "document_number": "J88721990",
            "full_name": "TARIQ MAHMOOD",
            "nationality": "PAK",
            "reason": "Terror Financing Watchlist (FATF High Risk Annexure)",
            "severity": "CRITICAL",
            "issuing_agency": "Ministry of Home Affairs (MHA)",
            "is_active": True,
            "added_at": "2026-09-01T00:00:00Z"
        }
    ]

    # 3. Documents
    doc1_id = str(uuid.uuid4())
    doc2_id = str(uuid.uuid4())
    doc3_id = str(uuid.uuid4())
    doc4_id = str(uuid.uuid4())
    doc5_id = str(uuid.uuid4())
    doc6_id = str(uuid.uuid4())
    doc7_id = str(uuid.uuid4())

    docs = [
        {
            "id": doc1_id,
            "document_type": "passport",
            "document_number": "DEMO-PPT-001",
            "full_name": "TEST PERSON ALPHA",
            "nationality": "IND",
            "date_of_birth": "1998-03-14",
            "date_of_expiry": "2031-08-20",
            "gender": "M",
            "issuing_country": "India",
            "issuing_authority": "Demo Passport Authority",
            "file_path": "demo_documents/DEMO-PPT-001.png",
            "document_hash": "a1b2c3d4e5f6001",
            "ocr_text": "TEST PERSON ALPHA | DEMO-PPT-001 | IND | 14 MAR 1998 | 20 AUG 2031",
            "document_status": "ACTIVE",
            "created_by": officer_id,
            "is_demo": True,
            "created_at": "2026-09-01T08:00:00Z"
        },
        {
            "id": doc2_id,
            "document_type": "driving_license",
            "document_number": "DEMO-DL-002",
            "full_name": "TEST PERSON BETA",
            "nationality": "IND",
            "date_of_birth": "2000-07-22",
            "date_of_expiry": "2030-07-21",
            "gender": "F",
            "issuing_country": "India",
            "issuing_authority": "Demo Transport Authority",
            "file_path": "demo_documents/DEMO-DL-002.png",
            "document_hash": "a1b2c3d4e5f6002",
            "ocr_text": "TEST PERSON BETA | DEMO-DL-002 | DOB 22 JUL 2000 | EXP 21 JUL 2030",
            "document_status": "ACTIVE",
            "created_by": officer_id,
            "is_demo": True,
            "created_at": "2026-09-01T08:15:00Z"
        },
        {
            "id": doc3_id,
            "document_type": "passport",
            "document_number": "DEMO-PPT-003",
            "full_name": "TEST PERSON GAMMA",
            "nationality": "IND",
            "date_of_birth": "1995-11-02",
            "date_of_expiry": "2024-05-10",
            "gender": "M",
            "issuing_country": "India",
            "issuing_authority": "Demo Passport Authority",
            "file_path": "demo_documents/DEMO-PPT-003.png",
            "document_hash": "a1b2c3d4e5f6003",
            "ocr_text": "TEST PERSON GAMMA | DEMO-PPT-003 | IND | 02 NOV 1995 | 10 MAY 2024",
            "document_status": "EXPIRED",
            "created_by": officer_id,
            "is_demo": True,
            "created_at": "2026-09-01T08:30:00Z"
        },
        {
            "id": doc4_id,
            "document_type": "passport",
            "document_number": "DEMO-PPT-004",
            "full_name": "TEST PERSON DELTA",
            "nationality": "IND",
            "date_of_birth": "1997-01-18",
            "date_of_expiry": "2030-12-30",
            "gender": "M",
            "issuing_country": "India",
            "issuing_authority": "Demo Passport Authority",
            "file_path": "demo_documents/DEMO-PPT-004-TAMPERED.png",
            "document_hash": "a1b2c3d4e5f6004",
            "ocr_text": "TEST PERSON DELTA | DEMO-PPT-004 | IND | 18 JAN 1997 | 30 DEC 2030",
            "document_status": "ACTIVE",
            "created_by": officer_id,
            "is_demo": True,
            "created_at": "2026-09-01T08:45:00Z"
        },
        {
            "id": doc5_id,
            "document_type": "passport",
            "document_number": "DEMO-PPT-005",
            "full_name": "TEST PERSON EPSILON",
            "nationality": "IND",
            "date_of_birth": "1999-09-09",
            "date_of_expiry": "2032-09-08",
            "gender": "F",
            "issuing_country": "India",
            "issuing_authority": "Demo Passport Authority",
            "file_path": "demo_documents/DEMO-PPT-005.png",
            "document_hash": "a1b2c3d4e5f6005",
            "ocr_text": "TEST PERSON EPSILON | DEMO-PPT-005 | IND | 09 SEP 1999 | 08 SEP 2032",
            "document_status": "ACTIVE",
            "created_by": officer_id,
            "is_demo": True,
            "created_at": "2026-09-01T09:00:00Z"
        },
        {
            "id": doc6_id,
            "document_type": "visa",
            "document_number": "DEMO-VISA-006",
            "full_name": "TEST PERSON ZETA",
            "nationality": "IND",
            "date_of_birth": "1996-04-25",
            "date_of_expiry": "2027-04-24",
            "gender": "F",
            "visa_type": "Tourist",
            "visa_entry_type": "Multiple",
            "visa_stay_duration_days": 90,
            "issuing_country": "Demo Country",
            "issuing_authority": "Demo Immigration Authority",
            "file_path": "demo_documents/DEMO-VISA-006.png",
            "document_hash": "a1b2c3d4e5f6006",
            "ocr_text": "TEST PERSON ZETA | DEMO-VISA-006 | TOURIST | MULTIPLE | 90 DAYS",
            "document_status": "ACTIVE",
            "created_by": officer_1_id,
            "is_demo": True,
            "created_at": "2026-09-01T09:15:00Z"
        },
        {
            "id": doc7_id,
            "document_type": "passport",
            "document_number": "910239248",
            "full_name": "Michelle De La Paz",
            "nationality": "United States of America",
            "date_of_birth": "1999-08-07",
            "date_of_expiry": "2018-02-05",
            "gender": "F",
            "issuing_country": "USA",
            "issuing_authority": "United States Department of State",
            "file_path": "demo_documents/demo_passport_expired_michelle.png",
            "document_hash": "f9e8d7c6b5a4007",
            "ocr_text": "PASSPORT / PASSEPORT UNITED STATES OF AMERICA | DE LA PAZ, MICHELLE | 910239248 | USA | 07 AUG 1999 | 05 FEB 2018 | F | MRZ: P<USADELAPAZ<<MICHELLE<<<<<<<<<<<<<<<<<<<<<<<<< 9102392482USA9908071F1802051900781200<129676",
            "document_status": "EXPIRED",
            "created_by": officer_1_id,
            "is_demo": True,
            "created_at": "2026-09-01T09:30:00Z"
        }
    ]
    _local_store["documents"] = docs

    # 4. Verification Records
    v1_id = str(uuid.uuid4())
    v2_id = str(uuid.uuid4())
    records = [
        {
            "id": v1_id,
            "verification_id": "VER-DEMO-001",
            "document_id": doc1_id,
            "officer_id": officer_id,
            "document_type": "passport",
            "document_number": "DEMO-PPT-001",
            "applicant_name": "TEST PERSON ALPHA",
            "ocr_status": "PASSED",
            "ocr_confidence": 98.50,
            "validation_status": "VALID",
            "mrz_valid": True,
            "tampering_status": "NOT_DETECTED",
            "tampering_score": 4.20,
            "face_verification_status": "MATCH",
            "face_match_score": 96.80,
            "risk_score": 8.50,
            "risk_level": "LOW",
            "final_result": "VERIFIED",
            "document_hash": "a1b2c3d4e5f6001",
            "is_demo": True,
            "created_at": "2026-09-01T08:05:00Z"
        },
        {
            "id": v2_id,
            "verification_id": "VER-DEMO-002",
            "document_id": doc2_id,
            "officer_id": officer_id,
            "document_type": "driving_license",
            "document_number": "DEMO-DL-002",
            "applicant_name": "TEST PERSON BETA",
            "ocr_status": "PASSED",
            "ocr_confidence": 97.00,
            "validation_status": "VALID",
            "mrz_valid": True,
            "tampering_status": "NOT_DETECTED",
            "tampering_score": 3.80,
            "face_verification_status": "MATCH",
            "face_match_score": 94.50,
            "risk_score": 6.00,
            "risk_level": "LOW",
            "final_result": "VERIFIED",
            "document_hash": "a1b2c3d4e5f6002",
            "is_demo": True,
            "created_at": "2026-09-01T08:20:00Z"
        }
    ]
    _local_store["verification_records"] = records

    # 5. Demo Scenarios
    scenarios = [
        {
            "id": str(uuid.uuid4()),
            "scenario_code": "SCN-001",
            "scenario_name": "Valid Indian Passport",
            "description": "Standard authentic biometric passport with valid dates and clean substrate.",
            "document_id": doc1_id,
            "document_type": "passport",
            "document_number": "DEMO-PPT-001",
            "full_name": "TEST PERSON ALPHA",
            "document_file_path": "demo_documents/DEMO-PPT-001.png",
            "person_photo_path": "demo_documents/person_alpha.png",
            "expected_result": "VERIFIED",
            "expected_risk_level": "LOW",
            "notes": "Authentic benchmark test.",
            "is_active": True,
            "is_demo": True,
            "created_at": "2026-09-01T08:00:00Z"
        },
        {
            "id": str(uuid.uuid4()),
            "scenario_code": "SCN-002",
            "scenario_name": "Valid Driving License",
            "description": "Standard national driving permit with valid validity period.",
            "document_id": doc2_id,
            "document_type": "driving_license",
            "document_number": "DEMO-DL-002",
            "full_name": "TEST PERSON BETA",
            "document_file_path": "demo_documents/DEMO-DL-002.png",
            "person_photo_path": "demo_documents/person_beta.png",
            "expected_result": "VERIFIED",
            "expected_risk_level": "LOW",
            "notes": "Valid alternative identity test.",
            "is_active": True,
            "is_demo": True,
            "created_at": "2026-09-01T08:15:00Z"
        },
        {
            "id": str(uuid.uuid4()),
            "scenario_code": "SCN-003",
            "scenario_name": "Expired Passport",
            "description": "Passport with an expired validity date.",
            "document_id": doc3_id,
            "document_type": "passport",
            "document_number": "DEMO-PPT-003",
            "full_name": "TEST PERSON GAMMA",
            "document_file_path": "demo_documents/DEMO-PPT-003.png",
            "person_photo_path": "demo_documents/person_gamma.png",
            "expected_result": "EXPIRED",
            "expected_risk_level": "HIGH",
            "notes": "Used to demonstrate expiry validation.",
            "is_active": True,
            "is_demo": True,
            "created_at": "2026-09-01T08:30:00Z"
        },
        {
            "id": str(uuid.uuid4()),
            "scenario_code": "SCN-004",
            "scenario_name": "Tampered Passport",
            "description": "Synthetic document containing simulated image manipulation.",
            "document_id": doc4_id,
            "document_type": "passport",
            "document_number": "DEMO-PPT-004",
            "full_name": "TEST PERSON DELTA",
            "document_file_path": "demo_documents/DEMO-PPT-004-TAMPERED.png",
            "person_photo_path": "demo_documents/person_delta.png",
            "expected_result": "SUSPICIOUS",
            "expected_risk_level": "HIGH",
            "notes": "Used to demonstrate OpenCV forensics and Gemini visual analysis.",
            "is_active": True,
            "is_demo": True,
            "created_at": "2026-09-01T08:45:00Z"
        },
        {
            "id": str(uuid.uuid4()),
            "scenario_code": "SCN-005",
            "scenario_name": "Face Mismatch",
            "description": "Valid-looking synthetic document with a different reference person.",
            "document_id": doc5_id,
            "document_type": "passport",
            "document_number": "DEMO-PPT-005",
            "full_name": "TEST PERSON EPSILON",
            "document_file_path": "demo_documents/DEMO-PPT-005.png",
            "person_photo_path": "demo_documents/wrong_person.png",
            "expected_result": "FAILED",
            "expected_risk_level": "HIGH",
            "notes": "Used to demonstrate biometric mismatch detection.",
            "is_active": True,
            "is_demo": True,
            "created_at": "2026-09-01T09:00:00Z"
        },
        {
            "id": str(uuid.uuid4()),
            "scenario_code": "SCN-006",
            "scenario_name": "Valid Visa",
            "description": "Synthetic tourist visa with valid dates.",
            "document_id": doc6_id,
            "document_type": "visa",
            "document_number": "DEMO-VISA-006",
            "full_name": "TEST PERSON ZETA",
            "document_file_path": "demo_documents/DEMO-VISA-006.png",
            "person_photo_path": "demo_documents/person_zeta.png",
            "expected_result": "VERIFIED",
            "expected_risk_level": "LOW",
            "notes": "Synthetic demonstration scenario only.",
            "is_active": True,
            "is_demo": True,
            "created_at": "2026-09-01T09:15:00Z"
        },
        {
            "id": str(uuid.uuid4()),
            "scenario_code": "SCN-007",
            "scenario_name": "Expired US Passport (Michelle)",
            "description": "Standard US biometric passport with expired validity (2018-02-05).",
            "document_id": doc7_id,
            "document_type": "passport",
            "document_number": "910239248",
            "full_name": "Michelle De La Paz",
            "nationality": "United States of America",
            "date_of_birth": "1999-08-07",
            "date_of_expiry": "2018-02-05",
            "document_file_path": "demo_documents/demo_passport_expired_michelle.png",
            "person_photo_path": "demo_documents/demo_passport_expired_michelle.png",
            "expected_result": "EXPIRED",
            "expected_risk_level": "HIGH",
            "notes": "Expired document benchmark test with MRZ detected.",
            "is_active": True,
            "is_demo": True,
            "created_at": "2026-09-01T09:30:00Z"
        }
    ]
    _local_store["demo_scenarios"] = scenarios

    # 6. Cryptographic Audit Logs
    audit_logs = []
    prev_h = "0000000000000000000000000000000000000000000000000000000000000000"
    for r in records:
        import hashlib
        c_h = hashlib.sha256(f"{prev_h}:{r['verification_id']}:{r['document_hash']}".encode()).hexdigest()
        audit_logs.append({
            "id": str(uuid.uuid4()),
            "verification_id": r["id"],
            "officer_id": officer_1_id,
            "action": "SCREENING_COMPLETED",
            "document_hash": r["document_hash"],
            "previous_hash": prev_h,
            "current_hash": c_h,
            "metadata": {"final_result": r["final_result"], "risk_score": r["risk_score"], "demo_record": True},
            "is_demo": True,
            "created_at": r["created_at"]
        })
        prev_h = c_h
    _local_store["audit_logs"] = audit_logs

    return len(records) + len(docs) + len(scenarios) + len(_local_store["blacklist"]) + 1

def clear_all_data() -> None:
    _local_store["officers"].clear()
    _local_store["documents"].clear()
    _local_store["verification_records"].clear()
    _local_store["audit_logs"].clear()
    _local_store["demo_scenarios"].clear()
    _local_store["blacklist"].clear()

# Initialize seeded memory store
seed_local_store_from_sql()

