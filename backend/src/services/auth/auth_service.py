import uuid
from datetime import datetime
from typing import Optional

from pymongo.database import Database

from src.schemas.auth_schema import UserRegisterRequest
from src.utils.security import create_access_token, hash_password, verify_password


class AuthError(Exception):
    """Raised for expected auth failures (duplicate user, bad credentials).

    Routers catch this and translate it into the appropriate HTTP response.
    """

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _users(db: Database):
    return db["users"]


def get_user_by_email(db: Database, email: str) -> Optional[dict]:
    return _users(db).find_one({"email": email.lower()})


def get_user_by_username(db: Database, username: str) -> Optional[dict]:
    return _users(db).find_one({"username": username.lower()})


def get_user_by_id(db: Database, user_id: str) -> Optional[dict]:
    return _users(db).find_one({"_id": user_id})


def register_user(db: Database, payload: UserRegisterRequest) -> dict:
    email = payload.email.lower()
    username = payload.username.lower()

    existing = _users(db).find_one({"$or": [{"email": email}, {"username": username}]})
    if existing:
        field = "email" if existing["email"] == email else "username"
        raise AuthError(f"An account with this {field} already exists.", status_code=409)

    now = datetime.utcnow()
    user_doc = {
        "_id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "username": username,
        "email": email,
        "phone": payload.phone,
        "password_hash": hash_password(payload.password),
        "region": payload.region,
        "accessibility_needs": [need.value for need in payload.accessibilityNeeds],
        "created_at": now,
        "updated_at": now,
    }

    _users(db).insert_one(user_doc)
    return user_doc


def authenticate_user(db: Database, identifier: str, password: str) -> dict:
    identifier_lower = identifier.lower()
    user = get_user_by_email(db, identifier_lower) or get_user_by_username(db, identifier_lower)

    if not user or not verify_password(password, user["password_hash"]):
        # Same message for "no such user" and "wrong password" so we don't
        # leak which part was incorrect.
        raise AuthError("Invalid email/username or password.", status_code=401)

    return user


def issue_token_for_user(user: dict) -> str:
    return create_access_token(data={"sub": user["_id"]})