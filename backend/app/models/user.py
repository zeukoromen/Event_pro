"""
User / Profile Model

Maps to user profile information synchronized with Supabase Auth (auth.users).
The 'id' string matches the Supabase UUID identifier.
"""

from typing import List, Optional
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Profile(Base, TimestampMixin):
    __tablename__ = "profiles"

    # ID directly matches Supabase Auth's user UUID
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)

    # Relationships
    events: Mapped[List["Event"]] = relationship(
        "Event",
        back_populates="organizer",
        cascade="all, delete-orphan",
    )
