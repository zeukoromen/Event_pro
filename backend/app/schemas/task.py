"""
Task Pydantic Schemas

Defines validation and serialization models for event tasks, Kanban status transitions,
and assignee relationships.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Short summary of task")
    description: Optional[str] = Field(None, description="Detailed task requirements or checklists")
    priority: str = Field("medium", description="low | medium | high")
    status: str = Field("to_do", description="to_do | in_progress | done")
    deadline: Optional[datetime] = Field(None, description="Due date and time")
    assignee_id: Optional[str] = Field(None, description="Attendee ID assigned to this task")


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None
    assignee_id: Optional[str] = None


class TaskRead(TaskBase):
    id: str
    event_id: str
    assignee_name: Optional[str] = None
    assignee_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskStats(BaseModel):
    total: int = 0
    to_do: int = 0
    in_progress: int = 0
    done: int = 0
    progress_percentage: int = 0
