"""
FastAPI Route Dependencies

Provides reusable dependency injections for database sessions and
authenticated user profiles.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_supabase_jwt, AuthenticatedUser
from app.models.user import Profile

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> Profile:
    """
    Enforces authentication on backend routes.
    Extracts Supabase JWT from Bearer header, validates it, and retrieves
    or automatically synchronizes the Profile record in the database.
    """
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: missing Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Decode and validate token
    auth_user: AuthenticatedUser = decode_supabase_jwt(auth.credentials)

    # Check if Profile exists in database
    result = await db.execute(select(Profile).where(Profile.id == auth_user.id))
    profile = result.scalars().first()

    # Synchronize Profile if not exists or if metadata updated
    if not profile:
        profile = Profile(
            id=auth_user.id,
            email=auth_user.email,
            full_name=auth_user.full_name,
            avatar_url=auth_user.avatar_url,
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    elif auth_user.full_name and profile.full_name != auth_user.full_name:
        profile.full_name = auth_user.full_name
        profile.avatar_url = auth_user.avatar_url or profile.avatar_url
        await db.commit()
        await db.refresh(profile)

    return profile


async def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[Profile]:
    """
    Optional authentication dependency.
    Used for endpoints like public RSVPs where an organizer or guest might
    already be logged in, but unauthenticated visitors are also permitted.
    """
    if not auth or not auth.credentials:
        return None

    try:
        auth_user = decode_supabase_jwt(auth.credentials)
        result = await db.execute(select(Profile).where(Profile.id == auth_user.id))
        return result.scalars().first()
    except Exception:
        return None
