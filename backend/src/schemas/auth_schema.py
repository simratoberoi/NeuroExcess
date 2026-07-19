from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from src.models.user import AccessibilityNeed


class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    username: str = Field(..., min_length=3, max_length=32)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=32)
    password: str = Field(..., min_length=8, max_length=128)
    region: Optional[str] = Field(None, max_length=64)
    accessibilityNeeds: List[AccessibilityNeed] = Field(default_factory=list)

    @field_validator("username")
    @classmethod
    def username_no_spaces(cls, v: str) -> str:
        if " " in v:
            raise ValueError("Username cannot contain spaces")
        return v.lower()


class UserLoginRequest(BaseModel):
    identifier: str = Field(..., description="Email or username")
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    username: str
    email: EmailStr
    phone: Optional[str] = None
    region: Optional[str] = None
    accessibilityNeeds: List[str]
    createdAt: datetime
    updatedAt: datetime

    @classmethod
    def from_user_doc(cls, doc: dict) -> "UserResponse":
        """Builds the response from a raw MongoDB document (a plain dict)."""
        return cls(
            id=doc["_id"],
            name=doc["name"],
            username=doc["username"],
            email=doc["email"],
            phone=doc.get("phone"),
            region=doc.get("region"),
            accessibilityNeeds=doc.get("accessibility_needs", []),
            createdAt=doc["created_at"],
            updatedAt=doc["updated_at"],
        )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse