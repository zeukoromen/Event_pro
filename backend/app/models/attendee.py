"""
Attendee / RSVP Model

Stores attendee identity, assigned role, dietary preferences,
and RSVP status (pending, attending, maybe, declined).
"""

from typing import List, Optional
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin, TimestampMixin


class Attendee(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "attendees"

    event_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("profiles.id", ondelete="SET NULL"),
        nullable=True,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(50), default="Guest", nullable=False)
    dietary_preferences: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # RSVP status: pending | attending | maybe | declined
    rsvp_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    event: Mapped["Event"] = relationship("Event", back_populates="attendees")
    assigned_tasks: Mapped[List["Task"]] = relationship("Task", back_populates="assignee")
