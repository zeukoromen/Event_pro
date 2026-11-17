"""
AI Event Planning Copilot Schemas

Defines request and response schemas for AI task generation,
invitation copy drafting, and schedule/agenda generation.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class SuggestedTask(BaseModel):
    title: str = Field(..., description="Actionable title for the event task")
    description: str = Field(..., description="Details and checklist steps")
    priority: str = Field("medium", description="high | medium | low")
    days_before: Optional[int] = Field(None, description="Suggested due days before event date")


class GenerateTasksRequest(BaseModel):
    event_id: Optional[str] = None
    title: str = Field(..., min_length=2, max_length=255)
    category: str = Field("Other", max_length=50)
    description: Optional[str] = None
    event_date: Optional[str] = None
    count: int = Field(6, ge=3, le=15)


class GenerateTasksResponse(BaseModel):
    tasks: List[SuggestedTask]
    category: str
    model_used: str


class BatchCreateTasksRequest(BaseModel):
    event_id: str
    tasks: List[SuggestedTask]


class GenerateInvitationRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    category: str = Field("Other", max_length=50)
    tone: str = Field("warm", description="warm | formal | casual | festive | poetic")
    host_name: Optional[str] = None
    custom_prompt: Optional[str] = None


class GenerateInvitationResponse(BaseModel):
    invitation_message: str
    suggested_subject: str
    tone: str
    model_used: str


class AgendaItem(BaseModel):
    time: str
    title: str
    description: str


class GenerateAgendaRequest(BaseModel):
    title: str
    category: str
    start_time: Optional[str] = "18:00"
    end_time: Optional[str] = "22:00"


class GenerateAgendaResponse(BaseModel):
    agenda: List[AgendaItem]
    model_used: str
