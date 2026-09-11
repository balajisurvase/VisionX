from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.models.schemas import TamperingResult
from backend.services.tampering_service import analyze_tampering

router = APIRouter(prefix="/tampering", tags=["Tampering Forensics"])

@router.post("/analyze", response_model=TamperingResult)
async def check_tampering(file: UploadFile = File(...)):
    """Performs hybrid OpenCV Error Level Analysis (ELA), metadata inspection, and Gemini multimodal vision forensics."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty document payload.")
    
    res = analyze_tampering(
        image_bytes=data,
        mime_type=file.content_type or "image/png",
        filename=file.filename or ""
    )
    return TamperingResult(
        tampering_detected=res.get("tampering_detected", False),
        tampering_score=res.get("tampering_score", 0.0),
        confidence=res.get("confidence", 90.0),
        regions=res.get("regions", []),
        method=res.get("method", "Hybrid (OpenCV ELA + Gemini Vision)"),
        details=res.get("details", {})
    )
