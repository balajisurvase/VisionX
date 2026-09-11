import re
from typing import Dict, Any, List

def calculate_mrz_check_digit(field: str) -> str:
    """
    Calculates ICAO 9303 check digit using the standard modulo-10 7-3-1 weighting scheme.
    Characters 'A'-'Z' map to 10-35, digits '0'-'9' to 0-9, and '<' maps to 0.
    """
    weights = [7, 3, 1]
    total = 0
    for idx, char in enumerate(field):
        weight = weights[idx % 3]
        if char.isdigit():
            val = int(char)
        elif char.isalpha():
            val = ord(char.upper()) - 55  # 'A'=10, ..., 'Z'=35
        else:
            val = 0  # filler '<' or other special chars
        total += val * weight
    return str(total % 10)

def parse_mrz(mrz_lines: List[str]) -> Dict[str, Any]:
    """
    Parses ICAO 9303 Machine Readable Zone lines:
    - TD3 (Passport): 2 lines of 44 characters
    - TD1 (ID Card): 3 lines of 30 characters
    - TD2 (Visa): 2 lines of 36 characters
    """
    clean_lines = [re.sub(r'[^A-Z0-9<]', '', line.upper()) for line in mrz_lines if line.strip()]
    
    if len(clean_lines) >= 2 and len(clean_lines[0]) >= 42 and len(clean_lines[1]) >= 42:
        return parse_td3(clean_lines[0][:44].ljust(44, '<'), clean_lines[1][:44].ljust(44, '<'))
    elif len(clean_lines) >= 3 and len(clean_lines[0]) >= 28:
        return parse_td1(clean_lines[0][:30].ljust(30, '<'), clean_lines[1][:30].ljust(30, '<'), clean_lines[2][:30].ljust(30, '<'))
    elif len(clean_lines) >= 2 and len(clean_lines[0]) >= 34:
        return parse_td2(clean_lines[0][:36].ljust(36, '<'), clean_lines[1][:36].ljust(36, '<'))
    
    return {
        "valid": False,
        "format": "UNKNOWN",
        "error": "Insufficient or invalid MRZ line lengths for ICAO 9303 standards"
    }

def parse_td3(line1: str, line2: str) -> Dict[str, Any]:
    """Parse standard TD3 passport MRZ (2 lines of 44 chars)."""
    # Line 1: P<INDSHARMA<<AARAV<<<<<<<<<<<<<<<<<<<<<<<<<<
    doc_type = line1[0:2].replace('<', '')
    issuing_country = line1[2:5].replace('<', '')
    name_part = line1[5:].strip('<')
    names = name_part.split('<<')
    surname = names[0].replace('<', ' ').strip() if len(names) > 0 else ""
    given_names = names[1].replace('<', ' ').strip() if len(names) > 1 else ""
    full_name = f"{given_names} {surname}".strip() if given_names else surname

    # Line 2: TESTP00123IND9804154M2804148<<<<<<<<<<<<<<02
    doc_number_raw = line2[0:9]
    doc_number = doc_number_raw.replace('<', '')
    doc_number_check = line2[9]
    calc_doc_check = calculate_mrz_check_digit(doc_number_raw)
    doc_number_valid = doc_number_check == calc_doc_check

    nationality = line2[10:13].replace('<', '')

    dob_raw = line2[13:19]
    dob_check = line2[19]
    calc_dob_check = calculate_mrz_check_digit(dob_raw)
    dob_valid = dob_check == calc_dob_check
    
    try:
        yy = int(dob_raw[:2])
        dob_formatted = f"19{dob_raw[0:2]}-{dob_raw[2:4]}-{dob_raw[4:6]}" if yy > 30 else f"20{dob_raw[0:2]}-{dob_raw[2:4]}-{dob_raw[4:6]}"
    except Exception:
        dob_formatted = dob_raw

    gender = line2[20].replace('<', 'X')

    expiry_raw = line2[21:27]
    expiry_check = line2[27]
    calc_expiry_check = calculate_mrz_check_digit(expiry_raw)
    expiry_valid = expiry_check == calc_expiry_check
    expiry_formatted = f"20{expiry_raw[0:2]}-{expiry_raw[2:4]}-{expiry_raw[4:6]}"

    # Optional composite check digit (over line2[0:10] + line2[13:20] + line2[21:43])
    composite_data = line2[0:10] + line2[13:20] + line2[21:43]
    composite_check = line2[43]
    calc_comp_check = calculate_mrz_check_digit(composite_data)
    comp_valid = composite_check == calc_comp_check

    overall_valid = doc_number_valid and dob_valid and expiry_valid

    return {
        "valid": overall_valid,
        "format": "TD3",
        "doc_type": doc_type,
        "issuing_country": issuing_country,
        "full_name": full_name,
        "surname": surname,
        "given_names": given_names,
        "document_number": doc_number,
        "document_number_valid": doc_number_valid,
        "nationality": nationality,
        "date_of_birth": dob_formatted,
        "dob_valid": dob_valid,
        "gender": gender,
        "date_of_expiry": expiry_formatted,
        "expiry_valid": expiry_valid,
        "composite_valid": comp_valid,
        "checks": [
            f"Doc Number Check Digit ({doc_number_check} vs calc {calc_doc_check}): {'PASS' if doc_number_valid else 'FAIL'}",
            f"DOB Check Digit ({dob_check} vs calc {calc_dob_check}): {'PASS' if dob_valid else 'FAIL'}",
            f"Expiry Check Digit ({expiry_check} vs calc {calc_expiry_check}): {'PASS' if expiry_valid else 'FAIL'}"
        ]
    }

def parse_td1(line1: str, line2: str, line3: str) -> Dict[str, Any]:
    """Parse standard TD1 identity card MRZ (3 lines of 30 chars)."""
    doc_type = line1[0:2].replace('<', '')
    issuing_country = line1[2:5].replace('<', '')
    doc_number = line1[5:14].replace('<', '')
    doc_check = line1[14]
    calc_doc_check = calculate_mrz_check_digit(line1[5:14])
    doc_valid = doc_check == calc_doc_check

    dob_raw = line2[0:6]
    dob_check = line2[6]
    calc_dob_check = calculate_mrz_check_digit(dob_raw)
    dob_valid = dob_check == calc_dob_check

    gender = line2[7].replace('<', 'X')
    expiry_raw = line2[8:14]
    exp_check = line2[14]
    calc_exp_check = calculate_mrz_check_digit(expiry_raw)
    exp_valid = exp_check == calc_exp_check

    nationality = line2[15:18].replace('<', '')

    name_part = line3.strip('<')
    names = name_part.split('<<')
    surname = names[0].replace('<', ' ').strip() if len(names) > 0 else ""
    given_names = names[1].replace('<', ' ').strip() if len(names) > 1 else ""
    full_name = f"{given_names} {surname}".strip() if given_names else surname

    try:
        yy = int(dob_raw[:2])
        dob_formatted = f"19{dob_raw[0:2]}-{dob_raw[2:4]}-{dob_raw[4:6]}" if yy > 30 else f"20{dob_raw[0:2]}-{dob_raw[2:4]}-{dob_raw[4:6]}"
    except Exception:
        dob_formatted = dob_raw

    expiry_formatted = f"20{expiry_raw[0:2]}-{expiry_raw[2:4]}-{expiry_raw[4:6]}"

    overall_valid = doc_valid and dob_valid and exp_valid

    return {
        "valid": overall_valid,
        "format": "TD1",
        "doc_type": doc_type,
        "issuing_country": issuing_country,
        "full_name": full_name,
        "document_number": doc_number,
        "nationality": nationality,
        "date_of_birth": dob_formatted,
        "gender": gender,
        "date_of_expiry": expiry_formatted,
        "checks": [
            f"TD1 Doc Number Check: {'PASS' if doc_valid else 'FAIL'}",
            f"TD1 DOB Check: {'PASS' if dob_valid else 'FAIL'}",
            f"TD1 Expiry Check: {'PASS' if exp_valid else 'FAIL'}"
        ]
    }

def parse_td2(line1: str, line2: str) -> Dict[str, Any]:
    """Parse standard TD2 visa / ID MRZ (2 lines of 36 chars)."""
    doc_type = line1[0:2].replace('<', '')
    issuing_country = line1[2:5].replace('<', '')
    name_part = line1[5:].strip('<')
    names = name_part.split('<<')
    full_name = f"{names[1]} {names[0]}".replace('<', ' ').strip() if len(names) > 1 else names[0].replace('<', ' ').strip()

    doc_number = line2[0:9].replace('<', '')
    doc_check = line2[9]
    calc_doc_check = calculate_mrz_check_digit(line2[0:9])
    doc_valid = doc_check == calc_doc_check

    nationality = line2[10:13].replace('<', '')
    dob_raw = line2[13:19]
    gender = line2[20].replace('<', 'X')
    expiry_raw = line2[21:27]

    return {
        "valid": doc_valid,
        "format": "TD2",
        "doc_type": doc_type,
        "issuing_country": issuing_country,
        "full_name": full_name,
        "document_number": doc_number,
        "nationality": nationality,
        "date_of_birth": dob_raw,
        "gender": gender,
        "date_of_expiry": expiry_raw,
        "checks": [f"TD2 Doc Check: {'PASS' if doc_valid else 'FAIL'}"]
    }
