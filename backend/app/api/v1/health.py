"""
Health Check Endpoint

A simple /health endpoint that returns API status, version, and environment.
This is used by:
  - The frontend to verify the backend is reachable
  - Future deployment health probes (Railway, Render, etc.)
  - Local development to confirm the server started correctly
"""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Returns the current health status of the API.

    Response includes:
    - status: always "ok" if this endpoint is reachable
    - version: API version string
    - environment: development | staging | production
    - timestamp: current UTC time (ISO 8601)
    """
    return {
        "status": "ok",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
