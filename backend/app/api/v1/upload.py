"""
Media & Invitation Document Upload API

Handles uploads of invitation cards, Canva export images, and PDF documents.
Files are persisted in the uploads/ directory and served statically.
"""

import os
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import BaseModel

router = APIRouter(tags=["upload"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_PDF_TYPES = {"application/pdf"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB


class UploadResponse(BaseModel):
    url: str
    filename: str
    original_filename: str = ""
    media_type: str  # "image" | "pdf"
    content_type: str


@router.post("/upload", response_model=UploadResponse)
async def upload_invitation_media(
    file: UploadFile = File(...),
) -> UploadResponse:
    """
    Uploads an invitation card image (JPG, PNG, WebP) or PDF invitation document.
    Returns relative URL to be embedded into the event's invitation_media_url.
    """
    content_type = file.content_type or ""

    if content_type in ALLOWED_IMAGE_TYPES:
        media_type = "image"
    elif content_type in ALLOWED_PDF_TYPES or file.filename.lower().endsWith(".pdf") if hasattr(file.filename, "lower") else False or (file.filename and file.filename.lower().endswith(".pdf")):
        media_type = "pdf"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload an image (PNG, JPG, WebP) or PDF document.",
        )

    # Sanitize filename
    clean_original = "".join(c for c in (file.filename or "file") if c.isalnum() or c in "._- ")
    unique_filename = f"{uuid.uuid4().hex[:12]}_{clean_original}"
    dest_path = UPLOAD_DIR / unique_filename

    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}",
        )

    return UploadResponse(
        url=f"/uploads/{unique_filename}",
        filename=unique_filename,
        original_filename=clean_original,
        media_type=media_type,
        content_type=content_type,
    )
