from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional
from backend.models.schemas import ValidationResult
from backend.services.validation_service import validate_document

router = APIRouter(prefix="/document", tags=["Validation"])

class ValidateDocumentPayload(BaseModel):
    document_type: str = "Passport"
    fields: Dict[str, Any]
    mrz_data: Optional[Dict[str, Any]] = None

@router.post("/validate", response_model=ValidationResult)
def validate_doc(payload: ValidateDocumentPayload):
    """Executes rule-based sovereign field, format, and expiry validation."""
    val = validate_document(payload.fields, payload.mrz_data, payload.document_type)
    return ValidationResult(
        status=val.get("status", "VALID"),
        checks=val.get("checks", []),
        errors=val.get("errors", []),
        warnings=val.get("warnings", [])
    )
