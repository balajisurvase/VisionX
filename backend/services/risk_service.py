from typing import Dict, Any, List

def calculate_risk(
    ocr_data: Dict[str, Any],
    validation_data: Dict[str, Any],
    tampering_data: Dict[str, Any],
    face_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Module 5: Interpretable Multi-Factor Threat & Risk Assessment Pipeline.
    Calculates unified threat index (0-100), risk level (LOW/MEDIUM/HIGH/CRITICAL),
    and plain-language contributing factors for border officers.
    """
    factors: List[str] = []
    recommendations: List[str] = []
    base_score = 4.0  # clean baseline

    # 1. Sovereign Blacklist Check (Automatic Critical Override)
    if validation_data.get("is_blacklisted"):
        blk_details = validation_data.get("blacklist_details") or {}
        reason = blk_details.get("reason", "Watchlist match")
        agency = blk_details.get("issuing_agency", "SSB / MHA / INTERPOL")
        factors.append(f"CRITICAL WATCHLIST HIT: Document or individual blacklisted for '{reason}' by {agency}")
        recommendations.append("IMMEDIATE DETENTION: Trigger Silent Code Red alarm at border terminal.")
        recommendations.append("Isolate traveler and notify Joint Interrogation Cell / Intelligence Bureau immediately.")
        return {
            "risk_score": 100,
            "risk_level": "CRITICAL",
            "final_result": "FAILED",
            "factors": factors,
            "recommendations": recommendations,
            "engine": "Deterministic Sovereign Threat Engine"
        }

    # 2. Validation & Chronological Analysis (Module 2)
    val_status = validation_data.get("status", "VALID")
    is_expired = validation_data.get("is_expired", False)
    mrz_valid = validation_data.get("mrz_valid")

    if is_expired:
        base_score += 60.0
        factors.append("Document validity has lapsed (Chronologically Expired credential)")
    elif val_status == "INVALID":
        base_score += 45.0
        factors.append("Mandatory sovereign fields or ICAO 9303 checksum failed")
    elif val_status == "SUSPICIOUS":
        base_score += 25.0
        factors.append("Discrepancies found between printed fields and machine-readable data")

    if mrz_valid is False:
        base_score += 35.0
        factors.append("ICAO 9303 MRZ Checksum Failure (Modulo-10 check digit mismatch)")

    if validation_data.get("cross_identity_match"):
        base_score += 50.0
        factors.append("Cross-identity duplicate record detected in sovereign database")

    for err in validation_data.get("errors", []):
        if err not in factors and not any(f in err for f in ["EXPIRED", "BLACKLISTED"]):
            factors.append(f"Validation anomaly: {err}")

    # 3. Forgery & Tampering Analysis (Module 3)
    t_score = float(tampering_data.get("tampering_score", 0.0))
    t_detected = tampering_data.get("tampering_detected", False)

    if t_detected or t_score >= 40.0:
        base_score += max(40.0, t_score * 0.70)
        regions_str = ", ".join(tampering_data.get("regions", ["Substrate discrepancy"]))
        factors.append(f"Forensic alteration / digital manipulation detected ({regions_str})")
    elif t_score > 15.0:
        base_score += t_score * 0.35
        factors.append(f"Minor compression / substrate variance detected (Score: {t_score:.1f})")

    # 4. Biometric Face Analysis (Module 4)
    if face_data.get("face_detected_person"):
        face_match = face_data.get("match", False)
        match_score = float(face_data.get("match_score", 0.0))
        if not face_match or match_score < 70.0:
            base_score += max(50.0, (100.0 - match_score) * 0.75)
            factors.append(f"Biometric facial mismatch: Traveler structure similarity ({match_score:.1f}%) is below security threshold (70.0%)")
        else:
            # Verified match provides a small positive confidence discount
            base_score = max(0.0, base_score - 5.0)

    # 5. Optical Scan Confidence (Module 1)
    ocr_conf = float(ocr_data.get("confidence", 95.0))
    if ocr_conf < 70.0:
        base_score += (70.0 - ocr_conf) * 0.4
        factors.append(f"Low optical scan resolution / OCR confidence ({ocr_conf:.1f}%)")

    # Final Normalized Score (0 to 100)
    final_score = int(min(100, max(0, round(base_score))))

    # Risk Level Categorization
    if final_score >= 75:
        risk_level = "HIGH"
    elif final_score >= 35:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # Final Verdict Resolution
    if t_detected and t_score >= 50.0:
        final_result = "SUSPICIOUS"
    elif face_data.get("face_detected_person") and not face_data.get("match"):
        final_result = "SUSPICIOUS"
    elif is_expired:
        final_result = "EXPIRED"
    elif val_status == "INVALID":
        final_result = "FAILED"
    elif final_score <= 30:
        final_result = "VERIFIED"
    else:
        final_result = "SUSPICIOUS" if final_score >= 50 else "NOT_VERIFIED"

    # Actionable Recommendations for Border Officers
    if final_result == "VERIFIED":
        recommendations.append("Permit regular cross-border clearance.")
        recommendations.append("Cryptographic audit fingerprint logged to sovereign ledger.")
    elif final_result == "EXPIRED":
        recommendations.append("Deny cross-border transit: Travel credential has lapsed.")
        recommendations.append("Direct traveler to consular services or emergency certificate division.")
    elif final_result == "SUSPICIOUS":
        recommendations.append("Hold traveler at inspection booth for secondary physical forensics.")
        recommendations.append("Perform UV light, holographic, and IR spectrometer credential inspection.")
        recommendations.append("Conduct biometric fingerprint scan and notify shift supervisor.")
    elif final_result == "FAILED":
        recommendations.append("Entry rejection: Fraudulent or corrupted credential.")
        recommendations.append("Escalate case to Joint Interrogation Cell.")
    else:
        recommendations.append("Request secondary supporting documentation (National ID / Visa / Ticket).")

    return {
        "risk_score": final_score,
        "risk_level": risk_level,
        "final_result": final_result,
        "factors": factors if factors else ["All optical, biometric, and sovereign parameters within safe tolerances"],
        "recommendations": recommendations,
        "engine": "Interpretable Multi-Factor Sovereign Risk Matrix"
    }
