"""
Event Pydantic Schemas

Defines validation and serialization models for event creation, updates,
retrieval, and dashboard statistics.
"""

from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field


class EventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Event name")
    description: Optional[str] = Field(None, description="Detailed event description")
    category: str = Field("Other", max_length=50, description="Event category")
    event_date: Optional[date] = Field(None, description="Date of the event")
    start_time: Optional[str] = Field(None, max_length=50, description="Start time (e.g. 18:00)")
    end_time: Optional[str] = Field(None, max_length=50, description="End time (e.g. 21:00)")
    location: Optional[str] = Field(None, max_length=255, description="Physical venue or virtual meeting link")
    cover_image_url: Optional[str] = Field(None, max_length=1024, description="Optional hero banner image URL")
    invitation_media_url: Optional[str] = Field(None, max_length=1024, description="Canva link, PDF URL, or digital invitation card image URL")
    invitation_media_type: Optional[str] = Field("image", max_length=50, description="image | canva | pdf")
    invitation_message: Optional[str] = Field(None, description="Personal invitation message from the host")
    is_published: bool = Field(True, description="Whether event invitation is publicly accessible")
    allow_maybe_rsvp: bool = Field(True, description="Allow guests to respond with 'Maybe'")
    collect_dietary_preferences: bool = Field(True, description="Prompt guests for dietary restrictions")


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    cover_image_url: Optional[str] = None
    invitation_media_url: Optional[str] = None
    invitation_media_type: Optional[str] = None
    invitation_message: Optional[str] = None
    is_published: Optional[bool] = None
    allow_maybe_rsvp: Optional[bool] = None
    collect_dietary_preferences: Optional[bool] = None


class EventRead(EventBase):
    id: str
    organizer_id: str
    public_token: str
    created_at: datetime
    updated_at: datetime

    # Computed fields
    attendee_count: int = 0
    confirmed_count: int = 0
    task_count: int = 0
    completed_task_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class DashboardStats(BaseModel):
    upcoming_events: int = 0
    total_events: int = 0
    confirmed_guests: int = 0
    pending_rsvps: int = 0
    tasks_due: int = 0
