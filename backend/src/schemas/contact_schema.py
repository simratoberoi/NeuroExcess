from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class ContactTopic(str, Enum):
    GENERAL = "General question"
    BUG = "Bug report"
    ACCESSIBILITY = "Accessibility feedback"
    EARLY_ACCESS = "Early access request"
    PARTNERSHIPS = "Partnerships"


class ContactCreate(BaseModel):
    name: str = Field(..., max_length=100, description="Sender's full name")
    email: EmailStr = Field(..., description="Sender's email address")
    topic: ContactTopic = Field(..., description="Category of the enquiry")
    message: str = Field(..., max_length=5000, description="Message body")


class ContactData(BaseModel):
    id: str
    name: str
    email: str
    topic: str
    created_at: datetime


class ContactResponse(BaseModel):
    success: bool
    message: str
    data: Optional[ContactData] = None
