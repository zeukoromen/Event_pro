"""
Task Collaboration API Endpoints

Provides CRUD operations and Kanban management for event tasks,
assignee assignment, and status transitions.
"""

from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import Profile
from app.models.event import Event
from app.models.attendee import Attendee
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskRead, TaskStats

router = APIRouter(tags=["tasks"])


def enrich_task_read(task: Task) -> TaskRead:
    """Helper to populate assignee_name and assignee_email on TaskRead."""
    assignee = getattr(task, "assignee", None)
    return TaskRead(
        id=task.id,
        event_id=task.event_id,
        assignee_id=task.assignee_id,
        assignee_name=assignee.name if assignee else None,
        assignee_email=assignee.email if assignee else None,
        title=task.title,
        description=task.description,
        priority=task.priority,
        status=task.status,
        deadline=task.deadline,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


async def get_verified_event(
    event_id: str,
    user_id: str,
    db: AsyncSession,
) -> Event:
    """Verifies event exists and is owned by the current organizer."""
    stmt = select(Event).where(and_(Event.id == event_id, Event.organizer_id == user_id))
    result = await db.execute(stmt)
    event = result.scalars().first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found or access denied",
        )
    return event


# ── Event Tasks List ─────────────────────────────────────────────────────────

@router.get("/events/{event_id}/tasks", response_model=List[TaskRead])
async def list_event_tasks(
    event_id: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[TaskRead]:
    """Retrieves all tasks for an event with eager loaded assignee details."""
    await get_verified_event(event_id, current_user.id, db)

    conditions = [Task.event_id == event_id]
    if status_filter and status_filter.lower() != "all":
        conditions.append(Task.status == status_filter.lower())
    if priority_filter and priority_filter.lower() != "all":
        conditions.append(Task.priority == priority_filter.lower())

    stmt = (
        select(Task)
        .options(selectinload(Task.assignee))
        .where(and_(*conditions))
        .order_by(Task.deadline.asc().nulls_last(), Task.created_at.desc())
    )
    result = await db.execute(stmt)
    tasks = result.scalars().all()

    return [enrich_task_read(t) for t in tasks]


# ── Create Task ─────────────────────────────────────────────────────────────

@router.post("/events/{event_id}/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_event_task(
    event_id: str,
    payload: TaskCreate,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TaskRead:
    """Creates a new task associated with an event."""
    await get_verified_event(event_id, current_user.id, db)

    # Validate assignee belongs to event if provided
    if payload.assignee_id:
        att_stmt = select(Attendee).where(
            and_(Attendee.id == payload.assignee_id, Attendee.event_id == event_id)
        )
        att_res = await db.execute(att_stmt)
        if not att_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assignee not found in event roster",
            )

    task = Task(
        id=str(uuid.uuid4()),
        event_id=event_id,
        assignee_id=payload.assignee_id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority.lower() if payload.priority else "medium",
        status=payload.status.lower() if payload.status else "to_do",
        deadline=payload.deadline,
    )
    db.add(task)
    await db.commit()

    # Re-query with eager load
    stmt = select(Task).options(selectinload(Task.assignee)).where(Task.id == task.id)
    refreshed = (await db.execute(stmt)).scalars().first()

    return enrich_task_read(refreshed)


# ── Update Task (Status Transition / Assignment) ────────────────────────────

@router.put("/events/{event_id}/tasks/{task_id}", response_model=TaskRead)
async def update_event_task(
    event_id: str,
    task_id: str,
    payload: TaskUpdate,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TaskRead:
    """Updates task fields (status, priority, assignee, deadline)."""
    await get_verified_event(event_id, current_user.id, db)

    stmt = select(Task).where(and_(Task.id == task_id, Task.event_id == event_id))
    result = await db.execute(stmt)
    task = result.scalars().first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found in this event",
        )

    # Validate assignee belongs to event if provided
    if payload.assignee_id is not None:
        if payload.assignee_id == "":
            task.assignee_id = None
        else:
            att_stmt = select(Attendee).where(
                and_(Attendee.id == payload.assignee_id, Attendee.event_id == event_id)
            )
            att_res = await db.execute(att_stmt)
            if not att_res.scalars().first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Assignee not found in event roster",
                )
            task.assignee_id = payload.assignee_id

    update_data = payload.model_dump(exclude_unset=True, exclude={"assignee_id"})
    for field, val in update_data.items():
        if field in ("status", "priority") and isinstance(val, str):
            setattr(task, field, val.lower())
        else:
            setattr(task, field, val)

    await db.commit()

    # Re-query with eager loaded assignee
    refresh_stmt = select(Task).options(selectinload(Task.assignee)).where(Task.id == task.id)
    refreshed = (await db.execute(refresh_stmt)).scalars().first()

    return enrich_task_read(refreshed)


# ── Delete Task ─────────────────────────────────────────────────────────────

@router.delete("/events/{event_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event_task(
    event_id: str,
    task_id: str,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Deletes a task from an event."""
    await get_verified_event(event_id, current_user.id, db)

    stmt = select(Task).where(and_(Task.id == task_id, Task.event_id == event_id))
    result = await db.execute(stmt)
    task = result.scalars().first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    await db.delete(task)
    await db.commit()


# ── Task Progress Stats ─────────────────────────────────────────────────────

@router.get("/events/{event_id}/tasks/stats", response_model=TaskStats)
async def get_event_task_stats(
    event_id: str,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TaskStats:
    """Returns task completion counts and readiness percentage for an event."""
    await get_verified_event(event_id, current_user.id, db)

    stmt = select(Task.status, func.count(Task.id)).where(Task.event_id == event_id).group_by(Task.status)
    result = await db.execute(stmt)
    counts = dict(result.all())

    to_do = counts.get("to_do", 0)
    in_progress = counts.get("in_progress", 0)
    done = counts.get("done", 0)
    total = to_do + in_progress + done
    progress = int((done / total) * 100) if total > 0 else 0

    return TaskStats(
        total=total,
        to_do=to_do,
        in_progress=in_progress,
        done=done,
        progress_percentage=progress,
    )


# ── Global Organizer Tasks (across all user events) ─────────────────────────

@router.get("/tasks/my", response_model=List[TaskRead])
async def list_my_tasks(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[TaskRead]:
    """Retrieves all tasks across all events organized by the current user."""
    stmt = (
        select(Task)
        .join(Event, Event.id == Task.event_id)
        .options(selectinload(Task.assignee))
        .where(Event.organizer_id == current_user.id)
        .order_by(Task.deadline.asc().nulls_last(), Task.created_at.desc())
    )
    result = await db.execute(stmt)
    tasks = result.scalars().all()

    return [enrich_task_read(t) for t in tasks]
