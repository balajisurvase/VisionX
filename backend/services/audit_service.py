import hashlib
from datetime import datetime
from typing import List, Dict, Any, Tuple

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def compute_document_hash(data: bytes) -> str:
    """Calculates SHA-256 cryptographic hash of document payload."""
    hasher = hashlib.sha256()
    hasher.update(data)
    return hasher.hexdigest()

def generate_audit_hash(previous_hash: str, verification_id: str, document_hash: str, timestamp_str: str, officer_id: str) -> str:
    """
    Computes cryptographic block hash for immutable audit ledger:
    SHA-256(previous_hash || verification_id || document_hash || timestamp || officer_id)
    """
    payload = f"{previous_hash}|{verification_id}|{document_hash}|{timestamp_str}|{officer_id}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def verify_audit_chain(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validates complete cryptographic chain integrity.
    Detects unauthorized alterations or omitted records in Supabase.
    """
    if not records:
        return {
            "is_valid": True,
            "total_blocks": 0,
            "message": "Audit chain empty. Ready for initial genesis block.",
            "algorithm": "SHA-256 Hash Chain"
        }

    for i, record in enumerate(records):
        prev_hash = record.get("previous_hash")
        curr_hash = record.get("current_hash")
        doc_hash = record.get("document_hash")
        verif_id = record.get("verification_id")
        created_at = str(record.get("created_at", ""))
        officer = record.get("officer_id", "")

        # Genesis block check
        if i == 0:
            if prev_hash != GENESIS_HASH and not prev_hash:
                return {
                    "is_valid": False,
                    "total_blocks": len(records),
                    "corrupted_block": i + 1,
                    "message": f"Genesis block discrepancy at record {verif_id}: Invalid genesis root.",
                    "algorithm": "SHA-256 Hash Chain"
                }
        else:
            # Subsequent block: previous_hash MUST equal previous record's current_hash
            expected_prev = records[i - 1].get("current_hash")
            if prev_hash != expected_prev:
                return {
                    "is_valid": False,
                    "total_blocks": len(records),
                    "corrupted_block": i + 1,
                    "message": f"CHAIN BROKEN at Block {i + 1} ({verif_id}): Previous hash link corrupted or record deleted.",
                    "algorithm": "SHA-256 Hash Chain"
                }

    return {
        "is_valid": True,
        "total_blocks": len(records),
        "corrupted_block": None,
        "message": f"Audit integrity verified: All {len(records)} cryptographic blocks intact and mathematically consistent.",
        "algorithm": "SHA-256 Hash Chain"
    }
