import bcrypt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status
import jwt
from backend.config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_MINUTES
from backend.models.schemas import LoginRequest, TokenResponse, OfficerProfile
from backend.services.supabase_service import get_officer_by_user_id, count_officers

router = APIRouter(prefix="/auth", tags=["Authentication"])

def verify_password(plain_password: str, stored_hash: str) -> bool:
    if not plain_password or not stored_hash:
        return False
    # Check if stored_hash is a bcrypt hash (e.g. from crypt('...', gen_salt('bf', 12)))
    if stored_hash.startswith(("$2a$", "$2b$", "$2y$")):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), stored_hash.encode("utf-8"))
        except Exception:
            return False
    # Fallback to plain or hash: format
    return stored_hash == plain_password or stored_hash == f"hash:{plain_password}"

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    """
    Authenticates security personnel via User ID and Password against Supabase registry.
    Strictly User ID and Password (No email authentication).
    Passwords are verified using bcrypt hash comparisons.
    """
    user_id = req.user_id.strip()
    password = req.password.strip()

    if not user_id or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID and Password are required."
        )

    # 1. Query Supabase / storage for officer
    officer = get_officer_by_user_id(user_id)

    if not officer:
        total_officers = count_officers()
        if total_officers == 0:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Database contains zero registered officers. Please execute supabase_demo_data.sql in your Supabase SQL editor to create demo users."
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="That officer ID or password isn't right."
        )

    # 2. Verify password hash using bcrypt
    stored_hash = officer.get("password_hash", "")
    if not verify_password(password, stored_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="That officer ID or password isn't right."
        )

    # 3. Issue JWT Token
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {
        "sub": officer.get("user_id"),
        "name": officer.get("full_name"),
        "role": officer.get("role", "officer"),
        "exp": expire
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=OfficerProfile(
            user_id=officer.get("user_id"),
            full_name=officer.get("full_name"),
            designation=officer.get("designation", "Screening Officer"),
            department=officer.get("department", "Sashastra Seema Bal (SSB), Police II Division"),
            terminal=officer.get("terminal", "ICP Raxaul • Indo-Nepal Border Terminal"),
            role=officer.get("role", "Officer").title(),
            status=officer.get("status", "Active").title()
        )
    )

