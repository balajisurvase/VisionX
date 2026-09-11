import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status

from backend.models.schemas import (
    ScreeningResult, OCRResult, OCRFields,
    ValidationResult, TamperingResult, FaceResult
)
from backend.services.ocr_service import extract_document_fields
from backend.services.validation_service import validate_document
from backend.services.tampering_service import analyze_tampering
from backend.services.face_service import verify_faces
from backend.services.risk_service import calculate_risk
from backend.services.audit_service import (
    compute_document_hash, generate_audit_hash
)
from backend.services.supabase_service import (
    save_verification_record, save_audit_log, get_latest_audit_hash,
    find_document_by_number, upload_document_to_storage, save_document_record
)

router = APIRouter(prefix="/verification", tags=["Automated Pipeline"])

@router.post("/screen", response_model=ScreeningResult)
async def screen_document(
    file: UploadFile = File(...),
    person_photo: Optional[UploadFile] = File(None),
    document_type: str = Form("Passport"),
    officer_id: str = Form("officer001")
):
    """
    End-to-End Sovereign Automated Identity Screening Pipeline (SIH 2026 Problem Statement 26188):
    1. Cryptographic Document Ingestion & SHA-256 Hashing
    2. Optical Character Recognition (Gemini 2.5 Flash Multimodal Vision + MRZ parsing)
    3. Deterministic Sovereign Rule-Based & ICAO 9303 Checksum Validation
    4. Digital Forensics & Tampering Detection (OpenCV ELA + Pillow EXIF + ORB Clone + Gemini Vision)
    5. Biometric 1:1 Face Verification (OpenCV Crop + Gemini Biometric Comparative Model)
    6. Multi-Factor Interpretable Threat Assessment & Border Recommendation Matrix
    7. Cryptographic Tamper-Evident SHA-256 Audit Blockchain & Sovereign Persistence
    """
    # 1. Read document bytes
    doc_bytes = await file.read()
    if not doc_bytes:
        raise HTTPException(status_code=400, detail="Uploaded document payload is empty.")

    # Compute SHA-256 document fingerprint
    doc_hash = compute_document_hash(doc_bytes)

    # 2. Read optional reference person photo
    person_bytes = None
    person_mime = "image/jpeg"
    person_filename = ""
    if person_photo:
        person_bytes = await person_photo.read()
        person_mime = person_photo.content_type or "image/jpeg"
        person_filename = person_photo.filename or ""

    doc_mime = file.content_type or "image/png"
    doc_filename = file.filename or "document.png"

    # 3. Stage 1: Optical Vision Field Extraction & MRZ Parsing
    ocr_res = extract_document_fields(
        image_bytes=doc_bytes,
        mime_type=doc_mime,
        document_type=document_type,
        filename=doc_filename
    )
    raw_text = ocr_res.get("raw_text", "")
    fields = ocr_res.get("fields", {})
    ocr_conf = float(ocr_res.get("confidence", 95.0))
    ocr_engine = ocr_res.get("engine", "Gemini 2.5 Flash")
    mrz_parsed = ocr_res.get("mrz_parsed")

    ocr_result = OCRResult(
        raw_text=raw_text,
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
                "visa_type": fields.get("visa_type"),
                "visa_entry_type": fields.get("visa_entry_type"),
                "visa_stay_duration_days": fields.get("visa_stay_duration_days")
            }
        ),
        confidence=ocr_conf,
        engine=ocr_engine,
        mrz_detected=bool(ocr_res.get("mrz_detected")),
        mrz_raw=ocr_res.get("mrz_raw")
    )

    # 4. Stage 2: Sovereign Rule-Based & ICAO 9303 Checksum Validation
    val_data = validate_document(fields, mrz_parsed, document_type)
    validation_result = ValidationResult(
        status=val_data.get("status", "VALID"),
        checks=val_data.get("checks", []),
        errors=val_data.get("errors", []),
        warnings=val_data.get("warnings", [])
    )

    # Cross-reference with sovereign database registry if document number known
    doc_number_str = fields.get("document_number")
    if doc_number_str:
        registry_doc = find_document_by_number(doc_number_str)
        if registry_doc:
            reg_status = registry_doc.get("document_status", "ACTIVE")
            validation_result.checks.append(f"Registry match: Record exists in database with status '{reg_status}'")
            if reg_status == "TAMPERED":
                val_data["status"] = "SUSPICIOUS"
                validation_result.errors.append("Document explicitly flagged as TAMPERED in sovereign registry")
            elif reg_status == "EXPIRED":
                val_data["status"] = "EXPIRED"

    # 5. Stage 3: Digital Forensics & Tampering Detection
    tamper_data = analyze_tampering(
        image_bytes=doc_bytes,
        mime_type=doc_mime,
        filename=doc_filename
    )
    tampering_result = TamperingResult(
        tampering_detected=tamper_data.get("tampering_detected", False),
        tampering_score=tamper_data.get("tampering_score", 0.0),
        confidence=tamper_data.get("confidence", 90.0),
        regions=tamper_data.get("regions", []),
        method=tamper_data.get("method", "Hybrid (OpenCV ELA + Gemini Vision)"),
        details=tamper_data.get("details", {})
    )

    # 6. Stage 4: Biometric 1:1 Facial Verification
    face_data = verify_faces(
        doc_bytes=doc_bytes,
        person_bytes=person_bytes,
        doc_mime_type=doc_mime,
        person_mime_type=person_mime,
        doc_filename=doc_filename,
        person_filename=person_filename
    )
    face_result = FaceResult(
        face_detected_document=face_data.get("face_detected_document", True),
        face_detected_person=face_data.get("face_detected_person", False),
        match_score=face_data.get("match_score", 0.0),
        match=face_data.get("match", False),
        engine=face_data.get("engine", "OpenCV Haar + Gemini 2.5 Flash"),
        details=face_data.get("details", {})
    )

    # 7. Stage 5: Multi-Factor Threat Assessment & Decision Matrix
    risk_data = calculate_risk(
        {"confidence": ocr_conf, "fields": fields},
        val_data,
        tamper_data,
        face_data
    )

    # 8. Stage 6: Cryptographic Tamper-Evident SHA-256 Audit Log & Storage
    verification_id = f"VER-SSB-{uuid.uuid4().hex[:8].upper()}"
    timestamp_str = datetime.utcnow().isoformat() + "Z"
    prev_hash = get_latest_audit_hash()
    current_hash = generate_audit_hash(prev_hash, verification_id, doc_hash, timestamp_str, officer_id)

    # Store file in Supabase Storage bucket (or local fallback)
    storage_path = upload_document_to_storage(doc_bytes, doc_filename, doc_mime)

    # Persist document metadata
    doc_record = {
        "id": str(uuid.uuid4()),
        "document_type": document_type.lower().replace(" ", "_"),
        "document_number": fields.get("document_number") or f"DOC-{uuid.uuid4().hex[:6].upper()}",
        "full_name": fields.get("full_name") or "UNKNOWN APPLICANT",
        "nationality": fields.get("nationality") or "IND",
        "date_of_birth": fields.get("date_of_birth"),
        "date_of_expiry": fields.get("date_of_expiry"),
        "gender": fields.get("gender"),
        "issuing_country": fields.get("issuing_country") or "India",
        "file_path": storage_path,
        "document_hash": doc_hash,
        "ocr_text": raw_text[:500] if raw_text else "",
        "document_status": "ACTIVE" if risk_data.get("final_result") == "VERIFIED" else "SUSPICIOUS",
        "created_by": officer_id,
        "is_demo": False,
        "created_at": timestamp_str
    }
    saved_doc = save_document_record(doc_record)
    doc_id = saved_doc.get("id", doc_record["id"])

    # Persist verification record
    record_payload = {
        "id": str(uuid.uuid4()),
        "verification_id": verification_id,
        "document_id": doc_id,
        "officer_id": officer_id,
        "document_type": document_type.lower().replace(" ", "_"),
        "document_number": fields.get("document_number"),
        "applicant_name": fields.get("full_name"),
        "ocr_status": "PASSED" if ocr_conf >= 70.0 else "WARNING",
        "ocr_confidence": ocr_conf,
        "ocr_data": fields,
        "validation_status": validation_result.status,
        "mrz_valid": val_data.get("mrz_valid", True),
        "validation_details": {"checks": validation_result.checks, "errors": validation_result.errors, "warnings": validation_result.warnings},
        "tampering_status": "SUSPICIOUS" if tampering_result.tampering_detected else "NOT_DETECTED",
        "tampering_score": tampering_result.tampering_score,
        "tampering_details": tampering_result.details,
        "face_verification_status": "MATCH" if face_result.match else ("MISMATCH" if face_result.face_detected_person else "NOT_PROVIDED"),
        "face_match_score": face_result.match_score,
        "risk_score": risk_data.get("risk_score", 0),
        "risk_level": risk_data.get("risk_level", "LOW"),
        "final_result": risk_data.get("final_result", "VERIFIED"),
        "document_hash": doc_hash,
        "is_demo": False,
        "created_at": timestamp_str
    }
    save_verification_record(record_payload)

    # Persist cryptographic audit log
    audit_payload = {
        "id": str(uuid.uuid4()),
        "verification_id": record_payload["id"],
        "officer_id": officer_id,
        "action": f"SCREENING_COMPLETED: {risk_data.get('final_result')}",
        "document_hash": doc_hash,
        "previous_hash": prev_hash,
        "current_hash": current_hash,
        "metadata": {
            "final_result": risk_data.get("final_result"),
            "risk_score": risk_data.get("risk_score"),
            "risk_level": risk_data.get("risk_level"),
            "doc_number": fields.get("document_number")
        },
        "is_demo": False,
        "created_at": timestamp_str
    }
    save_audit_log(audit_payload)

    return ScreeningResult(
        verification_id=verification_id,
        document_type=document_type,
        document_number=fields.get("document_number"),
        applicant_name=fields.get("full_name"),
        final_result=risk_data.get("final_result", "VERIFIED"),
        risk_score=risk_data.get("risk_score", 0),
        risk_level=risk_data.get("risk_level", "LOW"),
        ocr=ocr_result,
        validation=validation_result,
        tampering=tampering_result,
        face=face_result,
        document_hash=doc_hash,
        verified_by=officer_id,
        timestamp=timestamp_str,
        recommendations=risk_data.get("recommendations", [])
    )
