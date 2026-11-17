"""
Event Model

Stores event details, scheduling, location, branding, and public RSVP settings.
Public token is a secure unguessable string used for the `/e/:token` invitation view.
"""

import secrets
from typing import List, Optional
from datetime import date
from sqlalchemy import String, Text, Boolean, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin, TimestampMixin


def generate_public_token() -> str:
    """Generates a secure, 24-character unguessable URL-safe token."""
    return secrets.token_urlsafe(18)


class Event(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "events"

    # Organizer relationship
    organizer_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    organizer: Mapped["Profile"] = relationship("Profile", back_populates="events")

    # Core Event Information
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), default="Other", nullable=False)

    # Date and Schedule
    event_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    start_time: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    end_time: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Visual & Public Invitation Content
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    invitation_media_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    invitation_media_type: Mapped[Optional[str]] = mapped_column(String(50), default="image", nullable=True)
    invitation_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Public RSVP Token
    public_token: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        default=generate_public_token,
        nullable=False,
    )

    # Feature Toggles
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    allow_maybe_rsvp: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    collect_dietary_preferences: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    attendees: Mapped[List["Attendee"]] = relationship(
        "Attendee",
        back_populates="event",
        cascade="all, delete-orphan",
    )
    tasks: Mapped[List["Task"]] = relationship(
        "Task",
        back_populates="event",
        cascade="all, delete-orphan",
    )
