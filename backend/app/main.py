"""
Event Pro — FastAPI Application Entry Point

This file wires together the FastAPI app instance, lifespan events, middleware,
and all API routers. Keep it thin: configuration lives in core/config.py,
routes live in api/v1/, and business logic will live in services/.
"""

from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import init_db
from app.api.v1 import health, auth, events, attendees, tasks, upload, ai


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan Events
    Initializes database tables on startup.
    """
    try:
        await init_db()
    except Exception as e:
        print(f"Warning: Database initialization skipped or deferred: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Event Pro API — collaborative event planning platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the Vite dev server to reach this API during development.
# In production, set CORS_ORIGINS to your deployed frontend domain.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(events.router, prefix="/api/v1")
app.include_router(attendees.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(upload.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")

# Mount uploaded media directory
Path("uploads").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
async def root():
    """Root endpoint — useful for uptime checks."""
    return {"message": "Event Pro API is running", "docs": "/docs"}
