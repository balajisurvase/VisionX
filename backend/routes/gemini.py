from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging
from backend.services.gemini_service import get_gemini_client, is_gemini_available
from backend.config import GEMINI_API_KEY

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/gemini", tags=["Gemini AI Engine"])

class GeminiExplainRequest(BaseModel):
    document_type: Optional[str] = "Passport"
    extracted_fields: Optional[Dict[str, Any]] = None
    validation_status: Optional[str] = "VALID"
    tampering_detected: Optional[bool] = False
    tampering_score: Optional[float] = 0.0
    face_match_score: Optional[float] = 95.0
    risk_score: Optional[float] = 10.0
    risk_level: Optional[str] = "LOW"
    discrepancies: Optional[List[str]] = None

class GeminiExplainResponse(BaseModel):
    status: str
    model: str
    explanation: str
    recommendation: str
    inconsistencies: List[str]
    officer_notes: str

@router.get("/status")
def gemini_status():
    """
    Checks if Gemini 2.5/3.8 Flash is configured and reachable on the backend.
    Never exposes the raw GEMINI_API_KEY.
    """
    configured = is_gemini_available()
    if not configured:
        return {
            "configured": False,
            "status": "missing_key",
            "model": "gemini-3.8-flash",
            "message": "GEMINI_API_KEY is not set in backend environment."
        }
    
    try:
        client = get_gemini_client()
        # Ping with short test prompt
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents="State 'CONNECTED' if you can read this border screening ping."
        )
        return {
            "configured": True,
            "status": "connected",
            "model": "gemini-3.8-flash",
            "message": "Server-side Gemini Vision & Reasoning model active and verified.",
            "response_sample": response.text.strip()[:50] if response and response.text else "OK"
        }
    except Exception as e:
        logger.warning(f"Gemini test call notice: {e}")
        return {
            "configured": True,
            "status": "configured_offline",
            "model": "gemini-3.8-flash",
            "message": f"Gemini client initialized; live call returned: {str(e)[:100]}"
        }

@router.post("/explain", response_model=GeminiExplainResponse)
def gemini_explain(payload: GeminiExplainRequest):
    """
    Gemini explanation service:
    - Explaining verification results
    - Identifying possible inconsistencies between extracted fields
    - Generating officer-friendly explanations
    - Generating recommendations
    (Gemini must NOT be the only system used to decide whether a document is fake)
    """
    client = get_gemini_client()
    
    # Check if Gemini is available, else fallback cleanly
    if not client:
        # Clean deterministic fallback explanation
        tamper_txt = f"tampering detected ({payload.tampering_score}%)" if payload.tampering_detected else "no tampering detected"
        face_txt = f"facial similarity {payload.face_match_score}%" if payload.face_match_score else "biometrics validated"
        
        recom = "CLEAR FOR BORDER ENTRY" if payload.risk_level == "LOW" else ("SECONDARY INSPECTION MANDATORY" if payload.risk_level == "HIGH" else "MANUAL OFFICER REVIEW REQUIRED")
        
        return GeminiExplainResponse(
            status="fallback",
            model="Rule-Based Forensic Fallback",
            explanation=f"Document evaluated with risk level {payload.risk_level} (Score {payload.risk_score}/100). {tamper_txt.capitalize()} and {face_txt}.",
            recommendation=recom,
            inconsistencies=payload.discrepancies or [],
            officer_notes="Deterministic forensic scoring applied. Configure GEMINI_API_KEY for generative synthesis."
        )

    try:
        prompt = f"""
You are an expert border security AI assistant supporting border inspection officers.
Analyze this document screening report and provide a structured assessment:

Document Type: {payload.document_type}
Extracted Fields: {payload.extracted_fields}
Validation Status: {payload.validation_status}
Tampering Detected: {payload.tampering_detected} (Score: {payload.tampering_score})
Face Match Score: {payload.face_match_score}%
Risk Score: {payload.risk_score} / 100 ({payload.risk_level})
Known Discrepancies: {payload.discrepancies}

Task:
1. Explain the verification results clearly for an immigration officer.
2. Highlight any logical inconsistencies between extracted fields (e.g., DOB vs Expiry, country code vs nationality, checksum mismatch).
3. Provide a clear, actionable operational recommendation (e.g., "Allow Entry", "Refer to Secondary Inspection", "Detain for Document Fraud Investigation").

Respond with:
EXPLANATION: <2-3 sentences explaining findings>
INCONSISTENCIES: <comma-separated list of inconsistencies or 'None identified'>
RECOMMENDATION: <clear operational action>
OFFICER_NOTES: <key physical inspection pointers for the officer>
"""
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt
        )
        text = response.text or ""
        
        explanation = "Screening complete."
        recommendation = "Follow standard operational border procedure."
        inconsistencies: List[str] = []
        officer_notes = "Inspect physical holograms and tactile features."
        
        for line in text.splitlines():
            line_s = line.strip()
            if line_s.startswith("EXPLANATION:"):
                explanation = line_s.replace("EXPLANATION:", "").strip()
            elif line_s.startswith("RECOMMENDATION:"):
                recommendation = line_s.replace("RECOMMENDATION:", "").strip()
            elif line_s.startswith("INCONSISTENCIES:"):
                raw_inc = line_s.replace("INCONSISTENCIES:", "").strip()
                if raw_inc.lower() != "none identified" and raw_inc.lower() != "none":
                    inconsistencies = [i.strip() for i in raw_inc.split(",") if i.strip()]
            elif line_s.startswith("OFFICER_NOTES:"):
                officer_notes = line_s.replace("OFFICER_NOTES:", "").strip()
        
        if not explanation or explanation == "Screening complete.":
            explanation = text[:300]

        return GeminiExplainResponse(
            status="success",
            model="gemini-3.8-flash",
            explanation=explanation,
            recommendation=recommendation,
            inconsistencies=inconsistencies,
            officer_notes=officer_notes
        )
    except Exception as e:
        logger.error(f"Gemini explain generation error: {e}")
        return GeminiExplainResponse(
            status="fallback_on_error",
            model="Rule-Based Fallback",
            explanation=f"Evaluated with risk score {payload.risk_score} ({payload.risk_level}). Error during AI generation: {str(e)[:100]}.",
            recommendation="REFER TO SECONDARY INSPECTION" if payload.risk_score and payload.risk_score > 50 else "STANDARD OFFICER INSPECTION",
            inconsistencies=payload.discrepancies or [],
            officer_notes="Verify physical micro-printing and watermark integrity."
        )
