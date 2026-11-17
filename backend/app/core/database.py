"""
Database Session Management

Configures SQLAlchemy 2.0 asynchronous engine and session factory.
Supports Supabase PostgreSQL (asyncpg) or local SQLite fallback (aiosqlite).
"""

from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

import urllib.parse
from app.core.config import settings
from app.models.base import Base

# Determine connection URL: use configured DATABASE_URL or SQLite fallback
def get_database_url() -> str:
    url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""
    if not url or "your-password" in url or "[password]" in url:
        # Development fallback when Supabase connection string is not yet populated
        return "sqlite+aiosqlite:///./event_pro.db"

    # Automatically sanitize passwords that contain raw '@' symbols
    if "@" in url and url.count("@") > 1 and "://" in url:
        try:
            prefix, rest = url.split("://", 1)
            user_info, host_info = rest.rsplit("@", 1)
            if ":" in user_info:
                user, password = user_info.split(":", 1)
                encoded_password = urllib.parse.quote(password, safe="")
                url = f"{prefix}://{user}:{encoded_password}@{host_info}"
        except Exception:
            pass

    return url


database_url = get_database_url()

# SQLite needs connect_args check_same_thread=False
connect_args = {"check_same_thread": False} if "sqlite" in database_url else {}

engine = create_async_engine(
    database_url,
    echo=settings.ENVIRONMENT == "development",
    connect_args=connect_args,
    future=True,
)

async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an active database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Creates all tables if they do not exist (development helper)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Safe migration for new columns if on Postgres
        try:
            await conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS invitation_media_url VARCHAR(1024);"))
            await conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS invitation_media_type VARCHAR(50) DEFAULT 'image';"))
        except Exception:
            pass
