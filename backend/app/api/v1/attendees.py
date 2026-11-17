"""
Attendee Management API Endpoints

Provides CRUD operations, CSV bulk importing, and RSVP metrics for event attendees.
All organizer operations verify event ownership before executing.
"""

import io
import csv
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import Profile
from app.models.event import Event
from app.models.attendee import Attendee
from app.schemas.attendee import (
    AttendeeCreate,
    AttendeeUpdate,
    AttendeeRead,
    AttendeeCSVImportResult,
    AttendeeStats,
)

router = APIRouter(prefix="/events/{event_id}/attendees", tags=["attendees"])


async def verify_event_ownership(
    event_id: str,
    organizer_id: str,
    db: AsyncSession,
) -> Event:
    """Verifies event exists and belongs to the authenticated organizer."""
    stmt = select(Event).where(
        and_(Event.id == event_id, Event.organizer_id == organizer_id)
    )
    res = await db.execute(stmt)
    event = res.scalars().first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found or access denied",
        )
    return event


@router.post("", response_model=AttendeeRead, status_code=status.HTTP_201_CREATED)
async def add_attendee(
    event_id: str,
    payload: AttendeeCreate,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Attendee:
    """Adds a single attendee manually to the event roster."""
    await verify_event_ownership(event_id, current_user.id, db)

    # Check for duplicate email in this event
    existing_stmt = select(Attendee).where(
        and_(Attendee.event_id == event_id, Attendee.email == payload.email)
    )
    res = await db.execute(existing_stmt)
    if res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Attendee with email '{payload.email}' is already on the roster for this event.",
        )

    attendee = Attendee(
        event_id=event_id,
        **payload.model_dump(),
    )
    db.add(attendee)
    await db.commit()
    await db.refresh(attendee)
    return attendee


@router.get("", response_model=List[AttendeeRead])
async def list_attendees(
    event_id: str,
    rsvp_status: Optional[str] = Query(None, description="Filter by status: pending, attending, maybe, declined"),
    role: Optional[str] = Query(None, description="Filter by role: Organizer, Speaker, Volunteer, Guest"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[Attendee]:
    """Lists all attendees for the event with search and status filters."""
    await verify_event_ownership(event_id, current_user.id, db)

    stmt = select(Attendee).where(Attendee.event_id == event_id).order_by(Attendee.name.asc())

    if rsvp_status:
        stmt = stmt.where(Attendee.rsvp_status == rsvp_status)
    if role:
        stmt = stmt.where(Attendee.role == role)
    if search:
        q = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            func.lower(Attendee.name).like(q) | func.lower(Attendee.email).like(q)
        )

    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/stats", response_model=AttendeeStats)
async def get_attendee_stats(
    event_id: str,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AttendeeStats:
    """Returns attendance and RSVP breakdown counts for this event."""
    await verify_event_ownership(event_id, current_user.id, db)

    stmt = (
        select(
            func.count(Attendee.id).label("total"),
            func.count(Attendee.id).filter(Attendee.rsvp_status == "attending").label("attending"),
            func.count(Attendee.id).filter(Attendee.rsvp_status == "maybe").label("maybe"),
            func.count(Attendee.id).filter(Attendee.rsvp_status == "declined").label("declined"),
            func.count(Attendee.id).filter(Attendee.rsvp_status == "pending").label("pending"),
        )
        .where(Attendee.event_id == event_id)
    )
    res = await db.execute(stmt)
    row = res.first()

    return AttendeeStats(
        total=row.total if row else 0,
        attending=row.attending if row else 0,
        maybe=row.maybe if row else 0,
        declined=row.declined if row else 0,
        pending=row.pending if row else 0,
    )


@router.post("/import-csv", response_model=AttendeeCSVImportResult)
async def import_attendees_from_csv(
    event_id: str,
    file: UploadFile = File(...),
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AttendeeCSVImportResult:
    """
    Bulk imports attendees from a CSV file.
    Expected CSV columns (case-insensitive):
      name, email, [role], [dietary_preferences], [notes]
    Deduplicates against existing event attendees.
    """
    await verify_event_ownership(event_id, current_user.id, db)

    contents = await file.read()
    try:
        decoded = contents.decode("utf-8-sig")
    except UnicodeDecodeError:
        decoded = contents.decode("latin-1")

    reader = csv.DictReader(io.StringIO(decoded))
    if not reader.fieldnames:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded CSV file is empty or missing headers.",
        )

    # Normalize header mapping
    header_map = {col.strip().lower(): col for col in reader.fieldnames if col}
    name_col = next((header_map[k] for k in ["name", "full name", "attendee name"] if k in header_map), None)
    email_col = next((header_map[k] for k in ["email", "email address"] if k in header_map), None)
    role_col = next((header_map[k] for k in ["role", "type"] if k in header_map), None)
    dietary_col = next((header_map[k] for k in ["dietary", "dietary preferences", "diet"] if k in header_map), None)
    notes_col = next((header_map[k] for k in ["notes", "note", "responsibility"] if k in header_map), None)

    if not name_col or not email_col:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV must contain at least 'name' and 'email' columns.",
        )

    # Retrieve existing emails to avoid duplicates
    existing_res = await db.execute(
        select(Attendee.email).where(Attendee.event_id == event_id)
    )
    existing_emails = {row.lower() for row in existing_res.scalars().all()}

    imported = 0
    skipped = 0
    errors: List[str] = []
    total_processed = 0

    to_insert: List[Attendee] = []

    for idx, row in enumerate(reader, start=2):
        total_processed += 1
        name = (row.get(name_col) or "").strip()
        email = (row.get(email_col) or "").strip().lower()

        if not name or not email:
            errors.append(f"Row {idx}: Missing name or email.")
            skipped += 1
            continue

        if "@" not in email or "." not in email:
            errors.append(f"Row {idx}: Invalid email format '{email}'.")
            skipped += 1
            continue

        if email in existing_emails:
            skipped += 1
            continue

        role = (row.get(role_col) or "Guest").strip() if role_col else "Guest"
        dietary = (row.get(dietary_col) or "").strip() if dietary_col else None
        notes = (row.get(notes_col) or "").strip() if notes_col else None

        attendee = Attendee(
            event_id=event_id,
            name=name,
            email=email,
            role=role or "Guest",
            dietary_preferences=dietary or None,
            notes=notes or None,
            rsvp_status="pending",
        )
        to_insert.append(attendee)
        existing_emails.add(email)
        imported += 1

    if to_insert:
        db.add_all(to_insert)
        await db.commit()

    return AttendeeCSVImportResult(
        total_processed=total_processed,
        imported=imported,
        skipped=skipped,
        errors=errors[:10],  # Return up to 10 errors
    )


@router.put("/{attendee_id}", response_model=AttendeeRead)
async def update_attendee(
    event_id: str,
    attendee_id: str,
    payload: AttendeeUpdate,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Attendee:
    """Updates an existing attendee's details or RSVP status."""
    await verify_event_ownership(event_id, current_user.id, db)

    stmt = select(Attendee).where(
        and_(Attendee.id == attendee_id, Attendee.event_id == event_id)
    )
    res = await db.execute(stmt)
    attendee = res.scalars().first()
    if not attendee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendee not found on this event roster",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(attendee, field, val)

    await db.commit()
    await db.refresh(attendee)
    return attendee


@router.delete("/{attendee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_attendee(
    event_id: str,
    attendee_id: str,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Removes an attendee from the event roster."""
    await verify_event_ownership(event_id, current_user.id, db)

    stmt = select(Attendee).where(
        and_(Attendee.id == attendee_id, Attendee.event_id == event_id)
    )
    res = await db.execute(stmt)
    attendee = res.scalars().first()
    if not attendee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendee not found on this event roster",
        )

    await db.delete(attendee)
    await db.commit()
