from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from backend.services.supabase_service import get_verification_records, get_verification_by_id

router = APIRouter(prefix="/history", tags=["Screening History"])

@router.get("", response_model=List[Dict[str, Any]])
def get_history():
    """
    Returns authentic verification records from Supabase.
    If database contains no screening records, returns empty list.
    """
    return get_verification_records(limit=100)

@router.get("/{verification_id}", response_model=Dict[str, Any])
def get_history_detail(verification_id: str):
    """Fetches full forensic screening report for a specific verification ID."""
    record = get_verification_by_id(verification_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Screening record {verification_id} not found."
        )
    return record
