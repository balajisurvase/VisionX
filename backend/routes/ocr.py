from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.models.schemas import OCRResult, OCRFields
from backend.services.ocr_service import extract_document_fields

router = APIRouter(prefix="/ocr", tags=["OCR Extraction"])

@router.post("/extract", response_model=OCRResult)
async def extract_ocr(file: UploadFile = File(...)):
    """Extracts text, MRZ, and structured identity fields using Gemini 2.5 Flash Multimodal Vision."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty document payload.")
    
    res = extract_document_fields(
        image_bytes=data,
        mime_type=file.content_type or "image/png",
        document_type="Passport",
        filename=file.filename or ""
    )
    fields = res.get("fields", {})

    return OCRResult(
        raw_text=res.get("raw_text", ""),
        fields=OCRFields(
            full_name=fields.get("full_name"),
            document_number=fields.get("document_number"),
            nationality=fields.get("nationality"),
            date_of_birth=fields.get("date_of_birth"),
            date_of_expiry=fields.get("date_of_expiry"),
            gender=fields.get("gender"),
            extra={
                "issuing_country": fields.get("issuing_country"),
                "issuing_authority": fields.get("issuing_authority"),
                "visa_number": fields.get("visa_number"),
                "visa_type": fields.get("visa_type")
            }
        ),
        confidence=res.get("confidence", 95.0),
        engine=res.get("engine", "Gemini 2.5 Flash"),
        mrz_detected=res.get("mrz_detected", False),
        mrz_raw=res.get("mrz_raw")
    )
