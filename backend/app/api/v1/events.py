"""
Event Management API Endpoints

Provides CRUD operations for organizer events, public invitation lookup,
and organizer dashboard analytics.
"""

from typing import List, Optional
from datetime import date
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_current_user_optional
from app.core.database import get_db
from app.models.user import Profile
from app.models.event import Event
from app.models.attendee import Attendee
from app.models.task import Task
from app.schemas.event import EventCreate, EventUpdate, EventRead, DashboardStats
from app.schemas.attendee import PublicRSVPRequest, PublicRSVPResponse, AttendeeRead

router = APIRouter(tags=["events"])


def enrich_event_read(event: Event) -> EventRead:
    """Helper to populate attendee and task counts onto EventRead."""
    attendees = getattr(event, "attendees", []) or []
    tasks = getattr(event, "tasks", []) or []

    attendee_count = len(attendees)
    confirmed_count = sum(1 for a in attendees if a.rsvp_status == "attending")
    task_count = len(tasks)
    completed_task_count = sum(1 for t in tasks if t.status == "done")

    return EventRead(
        id=event.id,
        organizer_id=event.organizer_id,
        public_token=event.public_token,
        title=event.title,
        description=event.description,
        category=event.category,
        event_date=event.event_date,
        start_time=event.start_time,
        end_time=event.end_time,
        location=event.location,
        cover_image_url=event.cover_image_url,
        invitation_media_url=getattr(event, "invitation_media_url", None) or event.cover_image_url,
        invitation_media_type=getattr(event, "invitation_media_type", "image") or "image",
        invitation_message=event.invitation_message,
        is_published=event.is_published,
        allow_maybe_rsvp=event.allow_maybe_rsvp,
        collect_dietary_preferences=event.collect_dietary_preferences,
        created_at=event.created_at,
        updated_at=event.updated_at,
        attendee_count=attendee_count,
        confirmed_count=confirmed_count,
        task_count=task_count,
        completed_task_count=completed_task_count,
    )


# ── Organizer Event Endpoints ───────────────────────────────────────────────

@router.post("/events", response_model=EventRead, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: EventCreate,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EventRead:
    """Creates a new event under the authenticated organizer."""
    event = Event(
        organizer_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    # Automatically add the creator as Organizer in attendees table
    organizer_attendee = Attendee(
        event_id=event.id,
        user_id=current_user.id,
        name=current_user.full_name or "Organizer",
        email=current_user.email,
        role="Organizer",
        rsvp_status="attending",
    )
    db.add(organizer_attendee)
    await db.commit()

    # Re-fetch with relationships loaded
    stmt = (
        select(Event)
        .options(selectinload(Event.attendees), selectinload(Event.tasks))
        .where(Event.id == event.id)
    )
    res = await db.execute(stmt)
    full_event = res.scalar_one()

    return enrich_event_read(full_event)


@router.get("/events", response_model=List[EventRead])
async def list_my_events(
    filter_status: Optional[str] = Query(None, alias="status", description="upcoming | past | all"),
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[EventRead]:
    """Lists all events organized by the authenticated user."""
    stmt = (
        select(Event)
        .options(selectinload(Event.attendees), selectinload(Event.tasks))
        .where(Event.organizer_id == current_user.id)
        .order_by(Event.event_date.asc().nulls_last(), Event.created_at.desc())
    )

    today = date.today()
    if filter_status == "upcoming":
        stmt = stmt.where(Event.event_date >= today)
    elif filter_status == "past":
        stmt = stmt.where(Event.event_date < today)

    result = await db.execute(stmt)
    events = result.scalars().all()

    return [enrich_event_read(ev) for ev in events]


@router.get("/events/{event_id}", response_model=EventRead)
async def get_event_detail(
    event_id: str,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EventRead:
    """Retrieves single event details for the organizer."""
    stmt = (
        select(Event)
        .options(selectinload(Event.attendees), selectinload(Event.tasks))
        .where(and_(Event.id == event_id, Event.organizer_id == current_user.id))
    )
    result = await db.execute(stmt)
    event = result.scalars().first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found or access denied",
        )

    return enrich_event_read(event)


@router.put("/events/{event_id}", response_model=EventRead)
async def update_event(
    event_id: str,
    payload: EventUpdate,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EventRead:
    """Updates an existing event owned by the authenticated organizer."""
    stmt = (
        select(Event)
        .options(selectinload(Event.attendees), selectinload(Event.tasks))
        .where(and_(Event.id == event_id, Event.organizer_id == current_user.id))
    )
    result = await db.execute(stmt)
    event = result.scalars().first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found or access denied",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(event, field, val)

    await db.commit()
    await db.refresh(event)

    return enrich_event_read(event)


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Deletes an event owned by the authenticated organizer."""
    stmt = select(Event).where(
        and_(Event.id == event_id, Event.organizer_id == current_user.id)
    )
    result = await db.execute(stmt)
    event = result.scalars().first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found or access denied",
        )

    await db.delete(event)
    await db.commit()


# ── Public Invitation Endpoint ─────────────────────────────────────────────

@router.get("/events/public/{token}", response_model=EventRead)
async def get_public_event_by_token(
    token: str,
    db: AsyncSession = Depends(get_db),
) -> EventRead:
    """
    Public unauthenticated endpoint for guests viewing `/e/:token`.
    Retrieves published event details without exposing private primary keys.
    """
    stmt = (
        select(Event)
        .options(selectinload(Event.attendees), selectinload(Event.tasks))
        .where(and_(Event.public_token == token, Event.is_published == True))
    )
    result = await db.execute(stmt)
    event = result.scalars().first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found or event is not published",
        )

    return enrich_event_read(event)


@router.post("/events/public/{token}/rsvp", response_model=PublicRSVPResponse)
async def submit_public_rsvp(
    token: str,
    payload: PublicRSVPRequest,
    db: AsyncSession = Depends(get_db),
) -> PublicRSVPResponse:
    """
    Public unauthenticated endpoint for guests submitting their RSVP response.
    If the email already exists in the attendee roster for this event, updates their RSVP.
    Otherwise, registers a new attendee.
    """
    # Find published event by token
    stmt = select(Event).where(and_(Event.public_token == token, Event.is_published == True))
    result = await db.execute(stmt)
    event = result.scalars().first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found or event is not published",
        )

    # Validate maybe option if disabled
    if payload.rsvp_status == "maybe" and not event.allow_maybe_rsvp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="'Maybe' is not an available response option for this event",
        )

    # Check if attendee already exists with this email for this event
    att_stmt = select(Attendee).where(
        and_(
            Attendee.event_id == event.id,
            func.lower(Attendee.email) == payload.email.lower(),
        )
    )
    att_result = await db.execute(att_stmt)
    attendee = att_result.scalars().first()

    if attendee:
        attendee.name = payload.name
        attendee.rsvp_status = payload.rsvp_status
        if payload.dietary_preferences is not None:
            attendee.dietary_preferences = payload.dietary_preferences
        if payload.notes is not None:
            attendee.notes = payload.notes
        message = f"Thank you, {payload.name}! Your RSVP has been updated to '{payload.rsvp_status}'."
    else:
        attendee = Attendee(
            id=str(uuid.uuid4()),
            event_id=event.id,
            name=payload.name,
            email=payload.email.lower(),
            role="Guest",
            rsvp_status=payload.rsvp_status,
            dietary_preferences=payload.dietary_preferences,
            notes=payload.notes,
        )
        db.add(attendee)
        message = f"Thank you, {payload.name}! Your RSVP has been registered as '{payload.rsvp_status}'."

    await db.commit()
    await db.refresh(attendee)

    return PublicRSVPResponse(
        success=True,
        message=message,
        attendee=AttendeeRead.model_validate(attendee),
    )



# ── Organizer Dashboard Analytics ──────────────────────────────────────────

@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DashboardStats:
    """Computes real-time KPI metrics for the organizer's dashboard."""
    today = date.today()

    # Total events organized by user
    total_events_res = await db.execute(
        select(func.count(Event.id)).where(Event.organizer_id == current_user.id)
    )
    total_events = total_events_res.scalar() or 0

    # Upcoming events
    upcoming_res = await db.execute(
        select(func.count(Event.id)).where(
            and_(Event.organizer_id == current_user.id, Event.event_date >= today)
        )
    )
    upcoming_events = upcoming_res.scalar() or 0

    # Attendee stats across organizer's events
    attendee_stats_stmt = (
        select(
            func.count(Attendee.id).filter(Attendee.rsvp_status == "attending").label("confirmed"),
            func.count(Attendee.id).filter(Attendee.rsvp_status == "pending").label("pending"),
        )
        .join(Event, Event.id == Attendee.event_id)
        .where(Event.organizer_id == current_user.id)
    )
    attendee_res = await db.execute(attendee_stats_stmt)
    row = attendee_res.first()
    confirmed_guests = row.confirmed if row else 0
    pending_rsvps = row.pending if row else 0

    # Incomplete tasks across organizer's events
    tasks_res = await db.execute(
        select(func.count(Task.id))
        .join(Event, Event.id == Task.event_id)
        .where(and_(Event.organizer_id == current_user.id, Task.status != "done"))
    )
    tasks_due = tasks_res.scalar() or 0

    return DashboardStats(
        upcoming_events=upcoming_events,
        total_events=total_events,
        confirmed_guests=confirmed_guests,
        pending_rsvps=pending_rsvps,
        tasks_due=tasks_due,
    )
