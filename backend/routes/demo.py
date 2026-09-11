from fastapi import APIRouter
from typing import List
from backend.models.schemas import DemoScenarioItem
from backend.services.supabase_service import get_demo_scenarios

router = APIRouter(prefix="/demo", tags=["Demo Center"])

@router.get("/scenarios", response_model=List[DemoScenarioItem])
def list_demo_scenarios():
    """
    Retrieves evaluation demo scenarios from Supabase demo_scenarios table.
    If database is unseeded, returns an empty array.
    """
    scenarios = get_demo_scenarios()
    items = []
    for idx, s in enumerate(scenarios):
        # Extract demo number from scenario_code if available (e.g. SCN-001 -> 1)
        code = s.get("scenario_code", "")
        demo_num = idx + 1
        if code and "SCN-" in code:
            try:
                demo_num = int(code.replace("SCN-", "").lstrip("0") or "1")
            except Exception:
                demo_num = idx + 1

        name = s.get("scenario_name") or s.get("title", f"Scenario #{demo_num}")
        risk_lvl = s.get("expected_risk_level") or s.get("expected_risk", "LOW")
        score = 8 if risk_lvl == "LOW" else (94 if s.get("expected_result") == "FAILED" else 89)

        items.append(
            DemoScenarioItem(
                id=s.get("id", idx + 1),
                scenario_code=code,
                scenario_name=name,
                demo_number=demo_num,
                title=name,
                description=s.get("description", ""),
                document_type=s.get("document_type") or "Passport",
                document_number=s.get("document_number", ""),
                applicant_name=s.get("full_name") or s.get("applicant_name", ""),
                expected_result=s.get("expected_result", "VERIFIED"),
                expected_score=score,
                expected_risk=risk_lvl,
                expected_risk_level=risk_lvl,
                document_file_path=s.get("document_file_path"),
                person_photo_path=s.get("person_photo_path"),
                document_filename=s.get("document_file_path") or s.get("document_filename"),
                person_filename=s.get("person_photo_path") or s.get("person_filename"),
                notes=s.get("notes")
            )
        )
    return items

@router.post("/execute-sql")
def run_demo_sql():
    """
    Executes the demonstration SQL seeding into the database or local store.
    Populates officers, documents, verification records, audit logs, and demo scenarios.
    """
    from backend.services.supabase_service import seed_local_store_from_sql
    count = seed_local_store_from_sql()
    return {
        "status": "success",
        "message": f"Successfully loaded demo dataset from supabase_demo_data.sql ({count} records seeded)."
    }

@router.post("/reset-clean")
def reset_clean_state():
    """
    Clears all application data, simulating the clean initial state
    where only the database schema exists.
    """
    from backend.services.supabase_service import clear_all_data
    clear_all_data()
    return {
        "status": "success",
        "message": "Database reset to clean initial state. All sample data cleared."
    }

