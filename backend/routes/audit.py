from fastapi import APIRouter
from typing import List, Dict, Any
from backend.models.schemas import AuditVerificationResult
from backend.services.supabase_service import get_audit_logs
from backend.services.audit_service import verify_audit_chain

router = APIRouter(prefix="/audit", tags=["Audit Ledger"])

@router.get("/logs", response_model=List[Dict[str, Any]])
def list_audit_logs():
    """Retrieves immutable audit blocks from Supabase."""
    return get_audit_logs()

@router.post("/verify", response_model=AuditVerificationResult)
def verify_audit_ledger():
    """
    Validates complete SHA-256 cryptographic hash chain integrity.
    Confirms zero unauthorized alterations or deletions in the screening database.
    """
    logs = get_audit_logs()
    res = verify_audit_chain(logs)
    return AuditVerificationResult(
        is_valid=res.get("is_valid", True),
        total_blocks=res.get("total_blocks", 0),
        corrupted_block=res.get("corrupted_block"),
        message=res.get("message", "Chain intact"),
        algorithm="SHA-256 Hash Chain"
    )
