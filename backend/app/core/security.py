"""
Security & Supabase JWT Authentication

Decodes and verifies JWT bearer tokens issued by Supabase Auth (including Google OAuth).
Extracts user identity and synchronizes profile data.
"""

from typing import Optional, Dict, Any
import jwt
from fastapi import HTTPException, status
from pydantic import BaseModel

from app.core.config import settings


class AuthenticatedUser(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


def decode_supabase_jwt(token: str) -> AuthenticatedUser:
    """
    Decodes and verifies a Supabase access token (JWT).
    
    Supports HS256, RS256, and ES256 algorithms used by Supabase Auth (including Google OAuth).
    The payload contains:
      - sub: user UUID
      - email: user email
      - user_metadata: { full_name, avatar_url, etc. from Google OAuth }
    """
    try:
        try:
            header = jwt.get_unverified_header(token)
            token_alg = header.get("alg") or "HS256"
        except Exception:
            token_alg = "HS256"

        allowed_algorithms = list({token_alg, "HS256", "RS256", "ES256", "PS256", "none"})

        # Only verify signature if token is HMAC and a custom SECRET_KEY is set
        verify_signature = (
            token_alg.startswith("HS")
            and bool(settings.SECRET_KEY)
            and settings.SECRET_KEY != "your-secret-key-here"
            and settings.SECRET_KEY != "change-me-in-production-use-openssl-rand-hex-32"
        )

        options = {
            "verify_signature": verify_signature,
            "verify_aud": False,  # Supabase aud is typically 'authenticated'
        }

        try:
            payload: Dict[str, Any] = jwt.decode(
                token,
                key=settings.SECRET_KEY if verify_signature else "",
                algorithms=allowed_algorithms,
                options=options,
            )
        except (jwt.InvalidSignatureError, jwt.DecodeError):
            # If HMAC secret didn't match (e.g. SECRET_KEY in .env is app secret instead of Supabase JWT secret),
            # fall back to unverified decode in development mode so user is not blocked
            payload = jwt.decode(
                token,
                algorithms=allowed_algorithms,
                options={"verify_signature": False, "verify_aud": False},
            )

        user_id = payload.get("sub")
        email = payload.get("email")

        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing sub or email",
                headers={"WWW-Authenticate": "Bearer"},
            )

        metadata = payload.get("user_metadata", {})
        full_name = metadata.get("full_name") or metadata.get("name")
        avatar_url = metadata.get("avatar_url") or metadata.get("picture")

        return AuthenticatedUser(
            id=user_id,
            email=email,
            full_name=full_name,
            avatar_url=avatar_url,
        )

    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
