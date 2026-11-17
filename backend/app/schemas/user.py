"""
User & Profile Pydantic Schemas

Provides validation and serialization models for user profiles and authentication.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr


class ProfileBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class ProfileRead(ProfileBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
