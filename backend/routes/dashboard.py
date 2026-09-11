from fastapi import APIRouter
from backend.models.schemas import DashboardStats
from backend.services.supabase_service import get_dashboard_metrics

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardStats)
def get_dashboard():
    """
    Returns real dynamic operational metrics directly from Supabase database.
    If no records exist, returns zeroes and empty lists.
    NO hardcoded numbers.
    """
    metrics = get_dashboard_metrics()
    return DashboardStats(
        total_screenings=metrics["total_screenings"],
        verified_count=metrics["verified_count"],
        suspicious_count=metrics["suspicious_count"],
        failed_count=metrics["failed_count"],
        recent_verifications=metrics["recent_verifications"]
    )
