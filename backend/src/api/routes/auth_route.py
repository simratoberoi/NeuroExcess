"""
Auth routes: POST /auth/register, POST /auth/login, GET /auth/me
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.database import Database

from src.core.database import get_db
from src.schemas.auth_schema import (
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from src.services.auth.auth_service import (
    AuthError,
    authenticate_user,
    get_user_by_id,
    issue_token_for_user,
    register_user,
)
from src.utils.security import decode_access_token


logger = logging.getLogger(__name__)
router = APIRouter()

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Database = Depends(get_db),
) -> dict:
    """Reusable dependency — other routers (image, ocr, dashboard, etc.) can
    import this to require authentication without duplicating JWT logic."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if payload is None or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_id(db, payload["sub"])
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


# Note: these are plain `def` (not `async def`) since PyMongo's calls are
# synchronous — FastAPI automatically runs sync route functions in a
# threadpool, so this doesn't block the event loop.


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegisterRequest, db: Database = Depends(get_db)):
    try:
        user = register_user(db, payload)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    token = issue_token_for_user(user)
    return TokenResponse(access_token=token, user=UserResponse.from_user_doc(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLoginRequest, db: Database = Depends(get_db)):
    try:
        user = authenticate_user(db, payload.identifier, payload.password)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    token = issue_token_for_user(user)
    return TokenResponse(access_token=token, user=UserResponse.from_user_doc(user))


@router.get("/me", response_model=UserResponse)
def me(current_user: dict = Depends(get_current_user)):
    return UserResponse.from_user_doc(current_user)