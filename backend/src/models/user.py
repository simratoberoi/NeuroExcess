from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class AccessibilityNeed(str, Enum):
    BLINDNESS = "blindness"
    LOW_VISION = "low_vision"
    COLOR_VISION_DEFICIENCY = "color_vision_deficiency"
    DYSLEXIA = "dyslexia"
    ADHD_FOCUS = "adhd_focus_difficulties"
    AUTISM_SENSORY = "autism_sensory_sensitivity"
    MOTOR_IMPAIRMENT = "motor_impairment"
    TEMPORARY_IMPAIRMENT = "temporary_impairment"
    DEAF_HARD_OF_HEARING = "deaf_hard_of_hearing"


class UserInDB(BaseModel):
   

    id: str = Field(..., alias="_id")
    name: str
    username: str
    email: str
    phone: Optional[str] = None
    password_hash: str
    region: Optional[str] = None
    accessibility_needs: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}