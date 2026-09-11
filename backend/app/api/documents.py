from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse

from backend.app.config import MAX_UPLOAD_SIZE, ALLOWED_IMAGE_EXTENSIONS, UPLOAD_DIR
from backend.app.schemas.document import DocumentUploadResponse
from backend.app.services.preprocessing import preprocess_document_image

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Uploads document image, runs preprocessing, quality diagnostics, and stores artifacts."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is missing"
        )

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file_ext}'. Allowed formats: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}"
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds max size limit of {MAX_UPLOAD_SIZE // (1024 * 1024)}MB"
        )

    if len(content) < 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content is too small to be a valid document"
        )

    try:
        result = preprocess_document_image(content, file.filename)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image preprocessing failed: {str(e)}"
        )


@router.get("/{document_id}")
async def get_document_status(document_id: str):
    """Retrieves document asset status."""
    doc_dir = UPLOAD_DIR / document_id
    if not doc_dir.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found"
        )

    return {
        "document_id": document_id,
        "original_url": f"/uploads/{document_id}/original.jpg",
        "preprocessed_url": f"/uploads/{document_id}/preprocessed.jpg",
        "thumbnail_url": f"/uploads/{document_id}/thumbnail.jpg",
        "status": "PREPROCESSED"
    }
