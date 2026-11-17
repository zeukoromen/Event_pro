"""
Attendee Pydantic Schemas

Defines validation and serialization models for event attendee management,
CSV bulk import, and RSVP metrics.
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AttendeeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full name of attendee")
    email: EmailStr = Field(..., description="Valid email address")
    role: str = Field("Guest", max_length=50, description="Attendee role (e.g. Guest, Speaker, Volunteer, Organizer)")
    dietary_preferences: Optional[str] = Field(None, max_length=255, description="Allergies or dietary requirements")
    rsvp_status: str = Field("pending", description="pending | attending | maybe | declined")
    notes: Optional[str] = Field(None, description="Organizer internal notes or responsibilities")


class AttendeeCreate(AttendeeBase):
    pass


class AttendeeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    dietary_preferences: Optional[str] = None
    rsvp_status: Optional[str] = None
    notes: Optional[str] = None


class AttendeeRead(AttendeeBase):
    id: str
    event_id: str
    user_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AttendeeCSVImportResult(BaseModel):
    total_processed: int
    imported: int
    skipped: int
    errors: List[str] = []


class AttendeeStats(BaseModel):
    total: int = 0
    attending: int = 0
    maybe: int = 0
    declined: int = 0
    pending: int = 0


class PublicRSVPRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    rsvp_status: str = Field("attending", description="attending | maybe | declined")
    dietary_preferences: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = Field(None, max_length=1000)


class PublicRSVPResponse(BaseModel):
    success: bool = True
    message: str
    attendee: AttendeeRead

