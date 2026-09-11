from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from backend.models.schemas import RiskResult
from backend.services.risk_service import calculate_risk

router = APIRouter(prefix="/verification", tags=["Risk Assessment"])

class RiskAssessmentRequest(BaseModel):
    ocr_result: Dict[str, Any]
    validation_result: Dict[str, Any]
    tampering_result: Dict[str, Any]
    face_result: Dict[str, Any]

@router.post("/risk", response_model=RiskResult)
async def assess_risk(req: RiskAssessmentRequest):
    """Calculates multi-factor risk score (0-100), risk level (LOW/MEDIUM/HIGH/CRITICAL), and plain-language contributing factors."""
    res = calculate_risk(
        ocr_data=req.ocr_result,
        validation_data=req.validation_result,
        tampering_data=req.tampering_result,
        face_data=req.face_result
    )

    return RiskResult(
        risk_score=res.get("risk_score", 0),
        risk_level=res.get("risk_level", "LOW"),
        factors=res.get("factors", []),
        recommendations=res.get("recommendations", [])
    )
