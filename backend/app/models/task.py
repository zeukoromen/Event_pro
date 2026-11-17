"""
Task Model

Stores event preparation tasks, assigned attendees, priorities,
statuses (to_do, in_progress, done), and deadlines.
"""

from typing import Optional
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin, TimestampMixin


class Task(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "tasks"

    event_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assignee_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("attendees.id", ondelete="SET NULL"),
        nullable=True,
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Priority: low | medium | high
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)

    # Status: to_do | in_progress | done
    status: Mapped[str] = mapped_column(String(20), default="to_do", nullable=False, index=True)

    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    event: Mapped["Event"] = relationship("Event", back_populates="tasks")
    assignee: Mapped[Optional["Attendee"]] = relationship("Attendee", back_populates="assigned_tasks")
