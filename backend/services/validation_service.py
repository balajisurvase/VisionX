from datetime import datetime
from typing import Dict, Any, List, Optional
from backend.services.mrz_service import parse_mrz
from backend.services.supabase_service import (
    find_document_by_number, check_blacklist, find_cross_identity_discrepancy
)

def parse_date_flexibly(date_str: Optional[str]) -> Optional[datetime]:
    """Attempts to parse multiple standard date formats (DD-MM-YYYY, YYYY-MM-DD, etc.)."""
    if not date_str:
        return None
    cleaned = date_str.strip().replace('/', '-').replace('.', '-')
    formats = [
        "%d-%m-%Y", "%Y-%m-%d", "%d-%m-%y", "%Y%m%d",
        "%d-%b-%Y", "%d-%B-%Y", "%Y/%m/%d", "%d/%m/%Y"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(cleaned, fmt)
        except ValueError:
            continue
    return None

def validate_document(
    fields: Dict[str, Any],
    mrz_data: Optional[Dict[str, Any]] = None,
    document_type: str = "Passport"
) -> Dict[str, Any]:
    """
    Module 2: Sovereign Rule-Based Verification, ICAO 9303 Checksum Validation,
    Blacklist Screening, and Cross-Identity Discrepancy Detection.
    """
    checks: List[str] = []
    errors: List[str] = []
    warnings: List[str] = []
    violations: List[Dict[str, Any]] = []

    doc_num = fields.get("document_number")
    full_name = fields.get("full_name")
    dob_str = fields.get("date_of_birth")
    exp_str = fields.get("date_of_expiry")
    nationality = fields.get("nationality")

    now = datetime.utcnow()

    # 1. Mandatory Identity Fields
    if doc_num:
        checks.append(f"Document Number present: {doc_num}")
    else:
        errors.append("Document Number missing or undetectable from visual scan")
        violations.append({
            "rule_id": "RULE-DOC-001",
            "description": "Missing Sovereign Document Identifier",
            "severity": "CRITICAL"
        })

    if full_name:
        checks.append(f"Applicant Name present: {full_name}")
    else:
        errors.append("Applicant Full Name missing or unreadable")
        violations.append({
            "rule_id": "RULE-NAME-002",
            "description": "Missing Applicant Name",
            "severity": "HIGH"
        })

    # 2. Date of Birth & Age Logic
    if dob_str:
        dob_dt = parse_date_flexibly(dob_str)
        if dob_dt:
            if dob_dt > now:
                errors.append(f"Invalid Date of Birth ({dob_str}): DOB is in the future")
                violations.append({
                    "rule_id": "RULE-DOB-003",
                    "description": "Future Date of Birth detected",
                    "severity": "CRITICAL"
                })
            else:
                age = (now - dob_dt).days // 365
                if age > 120 or age < 0:
                    errors.append(f"Plausibility Failure: Implied age ({age} years) outside human threshold")
                    violations.append({
                        "rule_id": "RULE-AGE-004",
                        "description": f"Implied age ({age} years) physically implausible",
                        "severity": "HIGH"
                    })
                else:
                    checks.append(f"Date of Birth valid (Age: {age} years, DOB: {dob_dt.strftime('%d-%m-%Y')})")
        else:
            warnings.append(f"Non-standard Date of Birth format: {dob_str}")
    else:
        warnings.append("Date of Birth not extracted")

    # 3. Expiry Date & Chronological Validity (Server-Side Real Time Check)
    is_expired = False
    if exp_str:
        exp_dt = parse_date_flexibly(exp_str)
        if exp_dt:
            if exp_dt < now:
                is_expired = True
                errors.append(f"DOCUMENT EXPIRED on {exp_dt.strftime('%d-%m-%Y')} (Lapsed cross-border validity)")
                violations.append({
                    "rule_id": "RULE-EXP-005",
                    "description": f"Document expired on {exp_dt.strftime('%d-%m-%Y')}",
                    "severity": "CRITICAL"
                })
            else:
                days_left = (exp_dt - now).days
                if days_left < 180 and document_type.lower() == "passport":
                    warnings.append(f"Passport validity expires in {days_left} days (Less than 6-month rule)")
                    violations.append({
                        "rule_id": "RULE-EXP-006",
                        "description": "Passport expires in under 6 months",
                        "severity": "WARNING"
                    })
                checks.append(f"Document validity active until {exp_dt.strftime('%d-%m-%Y')} ({days_left} days remaining)")
        else:
            warnings.append(f"Non-standard Date of Expiry format: {exp_str}")
    else:
        warnings.append("Date of Expiry not identified on credential")

    # 4. ICAO 9303 MRZ Mathematical Checksum Verification
    mrz_valid = None
    if mrz_data and mrz_data.get("format") != "UNKNOWN":
        mrz_valid = mrz_data.get("valid", False)
        if mrz_valid:
            checks.append("ICAO 9303 MRZ Modulo-10 Check Digits (7-3-1 weighting): 100% Mathematically Valid")
            for c in mrz_data.get("checks", []):
                checks.append(f"MRZ: {c}")
        else:
            errors.append("ICAO 9303 MRZ Checksum Failure: Mathematical check digits do not match visual characters")
            violations.append({
                "rule_id": "RULE-MRZ-007",
                "description": "ICAO 9303 MRZ Checksum Failure",
                "severity": "CRITICAL"
            })
            for c in mrz_data.get("checks", []):
                if "FAIL" in c:
                    errors.append(f"MRZ Failure: {c}")

        # Visual zone vs MRZ zone cross-comparison
        mrz_doc = mrz_data.get("document_number")
        if doc_num and mrz_doc:
            if doc_num.replace(" ", "").upper() != mrz_doc.replace(" ", "").upper():
                errors.append(f"Visual vs MRZ Document Number Discrepancy (Visual: {doc_num} vs MRZ: {mrz_doc})")
                violations.append({
                    "rule_id": "RULE-XMRZ-008",
                    "description": "Visual document number does not match MRZ document number",
                    "severity": "CRITICAL"
                })
            else:
                checks.append("Visual document number matches MRZ line exactly")

    # 5. Blacklist / Sovereign Watchlist Lookup
    is_blacklisted = False
    blacklist_entry = None
    if doc_num:
        blacklist_entry = check_blacklist(doc_num, full_name)
        if blacklist_entry:
            is_blacklisted = True
            reason = blacklist_entry.get("reason", "Watchlist match")
            agency = blacklist_entry.get("issuing_agency", "SSB / MHA")
            errors.append(f"CRITICAL SECURITY ALERT: Document Number {doc_num} is BLACKLISTED ({reason} by {agency})")
            violations.append({
                "rule_id": "RULE-BLK-009",
                "description": f"Sovereign Blacklist Match: {reason}",
                "severity": "CRITICAL"
            })
        else:
            checks.append("Sovereign Blacklist & Interpol database query: NO WATCHLIST MATCH")

    # 6. Cross-Field Consistency (Multiple Identities Used by Same Individual)
    cross_identity_match = None
    if full_name and (dob_str or doc_num):
        cross_identity_match = find_cross_identity_discrepancy(full_name, dob_str or "", doc_num or "")
        if cross_identity_match:
            prev_doc = cross_identity_match.get("document_number")
            prev_type = cross_identity_match.get("document_type")
            errors.append(
                f"Cross-Identity Discrepancy: Individual '{full_name}' was previously registered with a different credential ({prev_type.upper()} {prev_doc})"
            )
            violations.append({
                "rule_id": "RULE-XID-010",
                "description": f"Multiple identities detected for {full_name} (Prior doc: {prev_doc})",
                "severity": "HIGH"
            })
        else:
            checks.append("Cross-identity duplicate registry search: Single sovereign identity confirmed")

    # 7. Overall Validation Verdict
    if is_blacklisted:
        status = "FAILED"
    elif is_expired:
        status = "EXPIRED"
    elif len(errors) > 0:
        status = "INVALID"
    elif len(warnings) > 0:
        status = "SUSPICIOUS"
    else:
        status = "VALID"

    return {
        "status": status,
        "checks": checks,
        "errors": errors,
        "warnings": warnings,
        "violations": violations,
        "is_expired": is_expired,
        "is_blacklisted": is_blacklisted,
        "blacklist_details": blacklist_entry,
        "cross_identity_match": cross_identity_match,
        "mrz_valid": mrz_valid
    }
