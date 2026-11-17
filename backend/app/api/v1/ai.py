"""
AI Event Planning Copilot API

Provides automated task generation, invitation tone customization,
run-of-show agenda generation, and batch task creation into the event board.
"""

from typing import List, Optional
import uuid
import json
import httpx
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import Profile
from app.models.event import Event
from app.models.task import Task
from app.schemas.ai import (
    GenerateTasksRequest,
    GenerateTasksResponse,
    SuggestedTask,
    BatchCreateTasksRequest,
    GenerateInvitationRequest,
    GenerateInvitationResponse,
    GenerateAgendaRequest,
    GenerateAgendaResponse,
    AgendaItem,
)
from app.schemas.task import TaskRead

router = APIRouter(prefix="/ai", tags=["ai"])


# ---------------------------------------------------------------------------
# Intelligent Event Planning Knowledge Engine (Built-in offline/fallback)
# ---------------------------------------------------------------------------

CATEGORY_TASK_TEMPLATES = {
    "wedding": [
        ("Book venue & finalize wedding date", "Confirm venue deposit, contract terms, and backup rain plan", "high", 180),
        ("Select wedding attire & fittings", "Schedule appointments for bride/groom attire and bridesmaid/groomsmen fittings", "medium", 120),
        ("Hire photographer & videographer", "Review portfolios, lock in shot list, and agree on delivery timeline", "high", 90),
        ("Catering tasting & cake order", "Sample menu options, finalize dietary alternatives, and select wedding cake", "high", 60),
        ("Send formal invitations", "Dispatch physical or digital invites with RSVP deadline 4 weeks before", "high", 45),
        ("Finalize floral arrangements & decor", "Confirm centerpiece designs, bouquets, ceremony arch, and setup time", "medium", 30),
        ("Create seating chart & place cards", "Organize table assignments based on confirmed RSVPs and dietary needs", "medium", 14),
        ("Rehearsal dinner & walk-through", "Coordinate ceremony procession, vows practice, and host bridal party dinner", "medium", 2),
    ],
    "conference": [
        ("Secure keynote & panel speakers", "Confirm speaker topics, bio blurbs, travel arrangements, and headshots", "high", 60),
        ("Launch ticketing & attendee registration", "Set early bird discounts, configure attendee badges, and publish schedule", "high", 45),
        ("Sponsor booth & partnership agreements", "Send sponsor packets, confirm booth placements, and collect banner logos", "medium", 30),
        ("Audio/Visual & streaming rehearsal", "Test microphones, projector feeds, slide clickers, and livestream links", "high", 7),
        ("Print badges & conference schedules", "Batch print attendee lanyards and organize check-in welcome bags", "medium", 3),
        ("Coordinate catering breaks & coffee", "Confirm morning coffee, boxed lunches, afternoon snacks, and water stations", "medium", 2),
        ("Post-event survey & recording release", "Email attendee feedback survey and publish recorded keynotes", "low", -1),
    ],
    "party": [
        ("Finalize guest list & theme decor", "Decide on color scheme, table decor, lighting, and party banners", "high", 21),
        ("Order custom cake & appetizers", "Place orders for party desserts, finger foods, and specialty drinks", "medium", 14),
        ("Curate music playlist or hire DJ", "Create a 4-hour curated playlist or brief the DJ on favorite genres", "medium", 7),
        ("Send reminder & location pin to guests", "Share directions, parking details, and gate codes with confirmed RSVPs", "medium", 2),
        ("Venue setup & ice/beverage chilling", "Decorate tables, chill beverages, arrange snack bars, and test sound", "high", 0),
    ],
    "celebration": [
        ("Reserve venue space & entertainment", "Confirm booking hours, stage/sound availability, and performer agreements", "high", 30),
        ("Order milestone party favors & memory book", "Prepare custom commemorative favors and a guest sign-in table", "medium", 14),
        ("Finalize speech & toast schedule", "Coordinate with family or friends giving toasts and allocate time slots", "medium", 5),
        ("Pre-chill refreshments & setup photo booth", "Set up background props, lighting, and camera station for memories", "medium", 1),
    ],
    "meetup": [
        ("Confirm presentation topic & speaker", "Review speaker slides, verify laptop connectors (HDMI/USB-C), and agenda", "high", 14),
        ("Send event reminder with venue access", "Provide transit directions, elevator codes, and check-in instructions", "medium", 3),
        ("Order networking pizza & drinks", "Confirm delivery time 30 mins before networking intermission", "medium", 2),
        ("Setup registration & welcome table", "Provide name tags, markers, and welcome signage at entrance", "medium", 0),
    ],
    "dinner": [
        ("Craft custom multi-course menu", "Select appetizers, main courses, dessert, and wine pairings", "high", 14),
        ("Confirm dietary allergies with attendees", "Check attendee roster for gluten, dairy, nut, or vegan preferences", "high", 5),
        ("Table setting & place card calligraphy", "Prepare linens, polished glassware, floral centerpieces, and candles", "medium", 1),
        ("Prep ingredients & welcome aperitif", "Chill welcome champagne/drinks and prep mise en place for smooth service", "high", 0),
    ],
}


# ---------------------------------------------------------------------------
# Endpoint 1: Generate AI Tasks
# ---------------------------------------------------------------------------

@router.post("/generate-tasks", response_model=GenerateTasksResponse)
async def generate_event_tasks(
    payload: GenerateTasksRequest,
    current_user: Profile = Depends(get_current_user),
) -> GenerateTasksResponse:
    """
    Generates intelligent preparation tasks tailored to the event title, category,
    and timeline. Leverages Gemini / OpenAI if configured, with an expert
    event-planning knowledge engine fallback.
    """
    cat_key = payload.category.lower().strip()
    templates = CATEGORY_TASK_TEMPLATES.get(cat_key, CATEGORY_TASK_TEMPLATES["party"])

    # If Gemini API key is available, attempt generative enrichment
    if settings.GEMINI_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                prompt = (
                    f"You are an expert event planner. Generate exactly {payload.count} actionable preparation tasks "
                    f"for an event titled '{payload.title}' in the '{payload.category}' category. "
                    f"Description: {payload.description or 'None'}. "
                    "Respond with a JSON array where each object has: "
                    "'title' (short string), 'description' (1-2 sentences), 'priority' ('high'|'medium'|'low'), "
                    "'days_before' (integer number of days before event)."
                )
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                res = await client.post(
                    url,
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"responseMimeType": "application/json"},
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(raw_text)
                    if isinstance(parsed, list) and len(parsed) > 0:
                        tasks = [
                            SuggestedTask(
                                title=item.get("title", "Event Task"),
                                description=item.get("description", ""),
                                priority=item.get("priority", "medium").lower(),
                                days_before=item.get("days_before", 7),
                            )
                            for item in parsed[: payload.count]
                        ]
                        return GenerateTasksResponse(
                            tasks=tasks,
                            category=payload.category,
                            model_used="gemini-1.5-flash",
                        )
        except Exception:
            pass  # Fall through to expert rule-based generator

    # Expert Domain Engine Generator
    selected_templates = templates[: payload.count]
    tasks = []
    for title, desc, prio, days in selected_templates:
        # Contextualize task title with event name if appropriate
        context_title = title if len(title) > 20 else f"{title} for {payload.title}"
        tasks.append(
            SuggestedTask(
                title=context_title,
                description=desc,
                priority=prio,
                days_before=days,
            )
        )

    return GenerateTasksResponse(
        tasks=tasks,
        category=payload.category,
        model_used="event-pro-copilot-engine",
    )


# ---------------------------------------------------------------------------
# Endpoint 2: Batch Create Tasks into Event Kanban
# ---------------------------------------------------------------------------

@router.post("/batch-create-tasks", response_model=List[TaskRead], status_code=status.HTTP_201_CREATED)
async def batch_create_tasks(
    payload: BatchCreateTasksRequest,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[TaskRead]:
    """
    1-Click batch creation of AI-suggested tasks directly into the event's Kanban board.
    Calculates specific due dates from days_before relative to event_date.
    """
    stmt = select(Event).where(
        and_(Event.id == payload.event_id, Event.organizer_id == current_user.id)
    )
    event = (await db.execute(stmt)).scalars().first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found or access denied",
        )

    created_tasks = []
    for suggested in payload.tasks:
        # Calculate deadline if event has date and suggested days_before
        deadline = None
        if event.event_date and suggested.days_before is not None:
            event_dt = datetime.combine(event.event_date, datetime.min.time())
            calculated = event_dt - timedelta(days=suggested.days_before)
            deadline = calculated if calculated > datetime.utcnow() else datetime.utcnow() + timedelta(days=1)

        task = Task(
            id=str(uuid.uuid4()),
            event_id=event.id,
            title=suggested.title,
            description=suggested.description,
            priority=suggested.priority.lower() if suggested.priority else "medium",
            status="to_do",
            deadline=deadline,
        )
        db.add(task)
        created_tasks.append(task)

    await db.commit()

    return [
        TaskRead(
            id=t.id,
            event_id=t.event_id,
            title=t.title,
            description=t.description,
            priority=t.priority,
            status=t.status,
            deadline=t.deadline,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        for t in created_tasks
    ]


# ---------------------------------------------------------------------------
# Endpoint 3: Generate AI Invitation Copy
# ---------------------------------------------------------------------------

INVITATION_TONE_TEMPLATES = {
    "warm": "We would be so deeply honored to have you celebrate with us. Your presence and joyful spirit mean the world to us as we create unforgettable memories together.",
    "formal": "You are cordially invited to join us for an evening of distinguished celebration and connection. We kindly request the honor of your presence.",
    "casual": "Can't wait to catch up, share great laughs, and celebrate together! Mark your calendar and get ready for a fantastic time.",
    "festive": "Get ready for good music, great drinks, and an epic celebration! We're bringing everyone together and it wouldn't be the same without you.",
    "poetic": "Under starlit skies and warm embrace, let us celebrate love, friendship, and cherished moments. Join us for a milestone to remember forever.",
}

@router.post("/generate-invitation", response_model=GenerateInvitationResponse)
async def generate_invitation_copy(
    payload: GenerateInvitationRequest,
    current_user: Profile = Depends(get_current_user),
) -> GenerateInvitationResponse:
    """
    Polishes or generates an invitation note in a chosen tone:
    warm, formal, casual, festive, or poetic.
    """
    tone = payload.tone.lower()
    host = payload.host_name or current_user.full_name or "Your Host"

    # Attempt Gemini API if key configured
    if settings.GEMINI_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                prompt = (
                    f"Write a {tone} 2-3 sentence personal invitation message from '{host}' "
                    f"for an event titled '{payload.title}' ({payload.category}). "
                    f"Custom note hint: '{payload.custom_prompt or 'None'}'. "
                    "Also provide a catchy email invitation subject line. "
                    "Respond with JSON: {'invitation_message': '...', 'suggested_subject': '...'}"
                )
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                res = await client.post(
                    url,
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"responseMimeType": "application/json"},
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    parsed = json.loads(data["candidates"][0]["content"]["parts"][0]["text"])
                    return GenerateInvitationResponse(
                        invitation_message=parsed.get("invitation_message", ""),
                        suggested_subject=parsed.get("suggested_subject", f"Invitation: {payload.title}"),
                        tone=tone,
                        model_used="gemini-1.5-flash",
                    )
        except Exception:
            pass

    # Built-in High Polish Tone Engine
    base_note = INVITATION_TONE_TEMPLATES.get(tone, INVITATION_TONE_TEMPLATES["warm"])
    message = f"{base_note} Warmly, {host}."

    return GenerateInvitationResponse(
        invitation_message=message,
        suggested_subject=f"You're Invited: {payload.title}",
        tone=tone,
        model_used="event-pro-copilot-engine",
    )


# ---------------------------------------------------------------------------
# Endpoint 4: Generate Run-of-Show Agenda
# ---------------------------------------------------------------------------

@router.post("/generate-agenda", response_model=GenerateAgendaResponse)
async def generate_agenda(
    payload: GenerateAgendaRequest,
    current_user: Profile = Depends(get_current_user),
) -> GenerateAgendaResponse:
    """Generates a structured run-of-show schedule for the event."""
    cat = payload.category.lower()

    if cat == "wedding":
        agenda = [
            AgendaItem(time="16:00", title="Guest Arrival & Welcome Music", description="Guests arrive, sign guestbook, and are seated by ushers"),
            AgendaItem(time="16:30", title="Ceremony & Vows Exchange", description="Processional, vows exchange, ring ceremony, and celebratory recessional"),
            AgendaItem(time="17:15", title="Cocktail Hour & Golden Hour Photos", description="Passed hors d'oeuvres, signature cocktails, and family portraits"),
            AgendaItem(time="18:30", title="Grand Entrance & Dinner Service", description="Bridal party entrance, welcome toasts, and multi-course plated dinner"),
            AgendaItem(time="20:00", title="Cake Cutting & First Dance", description="Ceremonial cake cutting followed by the first dance and parent dances"),
            AgendaItem(time="20:30", title="Open Dance Floor & Celebration", description="DJ opens dance floor, evening cocktails, and dessert station"),
            AgendaItem(time="22:30", title="Sparkler Send-Off", description="Guests line up for celebratory illuminated exit"),
        ]
    elif cat == "conference":
        agenda = [
            AgendaItem(time="08:30", title="Check-In & Welcome Coffee", description="Badge pickup, networking coffee, and sponsor exhibition exploration"),
            AgendaItem(time="09:15", title="Opening Remarks & Keynote Address", description="Welcome from organizers followed by the industry keynote speaker"),
            AgendaItem(time="10:30", title="Morning Breakout Sessions", description="Track A (Technical Architecture) and Track B (Product Strategy)"),
            AgendaItem(time="12:00", title="Networking Lunch & Sponsor Expo", description="Buffet lunch and live sponsor booth demonstrations"),
            AgendaItem(time="13:30", title="Panel Discussion: The Future Ahead", description="Moderated panel with Q&A from live attendees"),
            AgendaItem(time="15:00", title="Interactive Workshops", description="Hands-on breakout sessions and guided collaborative workshops"),
            AgendaItem(time="16:30", title="Closing Keynote & Evening Mixer", description="Final announcements followed by happy hour networking drinks"),
        ]
    else:
        agenda = [
            AgendaItem(time="18:00", title="Guest Arrival & Welcome Reception", description="Guests arrive, check in, and enjoy light refreshments"),
            AgendaItem(time="18:45", title="Welcome Speech & Milestone Toast", description="Host shares remarks, welcomes guests, and kicks off festivities"),
            AgendaItem(time="19:15", title="Dinner & Main Program", description="Food stations open, live background music, and mingling"),
            AgendaItem(time="20:30", title="Special Activities & Entertainment", description="Celebratory program, cake cutting, or entertainment"),
            AgendaItem(time="21:45", title="Closing Remarks & Farewell", description="Thanking attendees and distributing party favors"),
        ]

    return GenerateAgendaResponse(
        agenda=agenda,
        model_used="event-pro-copilot-engine",
    )
