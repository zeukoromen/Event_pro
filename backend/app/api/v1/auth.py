"""
Authentication & Profile Endpoints

Provides endpoints for retrieving and synchronizing the authenticated user's profile.
Authorization is enforced on the backend via the `get_current_user` dependency.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import Profile
from app.schemas.user import ProfileRead, ProfileUpdate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=ProfileRead)
async def get_my_profile(
    current_user: Profile = Depends(get_current_user),
) -> Profile:
    """
    Returns the authenticated user's profile information.
    Protected endpoint: requires valid Supabase Bearer token.
    """
    return current_user


@router.patch("/me", response_model=ProfileRead)
async def update_my_profile(
    payload: ProfileUpdate,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Profile:
    """
    Updates the authenticated user's profile (name, avatar).
    """
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url

    await db.commit()
    await db.refresh(current_user)
    return current_user
