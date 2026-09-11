from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional
from backend.models.schemas import FaceResult
from backend.services.face_service import verify_faces

router = APIRouter(prefix="/verification", tags=["Face Biometrics"])

@router.post("/face", response_model=FaceResult)
async def match_faces(
    document_image: UploadFile = File(...),
    person_image: Optional[UploadFile] = File(None)
):
    """Executes OpenCV facial detection, cropping, and Gemini 2.5 Flash biometric 1:1 matching."""
    doc_bytes = await document_image.read()
    if not doc_bytes:
        raise HTTPException(status_code=400, detail="Document image is required.")

    person_bytes = await person_image.read() if person_image else None

    res = verify_faces(
        doc_bytes=doc_bytes,
        person_bytes=person_bytes,
        doc_mime_type=document_image.content_type or "image/png",
        person_mime_type=person_image.content_type if person_image else "image/png",
        doc_filename=document_image.filename or "",
        person_filename=person_image.filename if person_image else ""
    )

    return FaceResult(
        face_detected_document=res.get("face_detected_document", True),
        face_detected_person=res.get("face_detected_person", False),
        match_score=res.get("match_score", 0.0),
        match=res.get("match", False),
        engine=res.get("engine", "OpenCV + Gemini 2.5 Flash"),
        details=res.get("details", {})
    )
