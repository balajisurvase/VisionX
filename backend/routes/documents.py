from fastapi import APIRouter, Query
from typing import List, Optional
from backend.models.schemas import DocumentItem
from backend.services.supabase_service import get_documents

router = APIRouter(prefix="/documents", tags=["Sovereign Documents"])

@router.get("", response_model=List[DocumentItem])
def list_documents(
    doc_type: Optional[str] = Query(None, alias="type"),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """
    Returns only documents actively recorded in the Supabase sovereign registry.
    If database is unseeded, returns an empty array.
    """
    docs = get_documents(doc_type=doc_type, status=status, search=search)
    return [
        DocumentItem(
            id=d.get("id", idx + 1),
            document_type=d.get("document_type", "Passport"),
            document_number=d.get("document_number", ""),
            full_name=d.get("full_name", ""),
            nationality=d.get("nationality", ""),
            date_of_birth=d.get("date_of_birth"),
            date_of_expiry=d.get("date_of_expiry"),
            gender=d.get("gender"),
            document_status=d.get("document_status", "VALID"),
            document_hash=d.get("document_hash", ""),
            created_at=str(d.get("created_at", ""))
        )
        for idx, d in enumerate(docs)
    ]
