"""
Application Configuration

All configuration is loaded from environment variables.
Never hardcode secrets, database URLs, or API keys in this file.

Uses Pydantic BaseSettings so that:
- Environment variables are automatically read from the OS environment
- A .env file is loaded automatically during development
- Every setting has a type and can be validated
- Missing required variables fail loudly at startup

To add a new setting:
1. Add it as a field here with its type and default value (or no default if required)
2. Add it to .env.example with a placeholder value
3. Document what it does in the comment above the field
"""

from typing import List, Union
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---------------------------------------------------------------------------
    # Application
    # ---------------------------------------------------------------------------
    PROJECT_NAME: str = "Event Pro"
    VERSION: str = "0.1.0"

    # "development" | "staging" | "production"
    ENVIRONMENT: str = "development"

    # ---------------------------------------------------------------------------
    # CORS — comma-separated list of allowed frontend origins or JSON array
    # Example: "http://localhost:5173,http://127.0.0.1:5173"
    # ---------------------------------------------------------------------------
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # ---------------------------------------------------------------------------
    # Database — Supabase PostgreSQL connection string
    # Format: postgresql+asyncpg://user:password@host:port/dbname
    # Leave empty during Phase 1 — database is not yet connected
    # ---------------------------------------------------------------------------
    DATABASE_URL: str = ""

    # ---------------------------------------------------------------------------
    # Supabase — public and service role keys
    # ---------------------------------------------------------------------------
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # ---------------------------------------------------------------------------
    # Authentication
    # ---------------------------------------------------------------------------
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"

    # ---------------------------------------------------------------------------
    # AI (Phase 3 — leave empty for now)
    # ---------------------------------------------------------------------------
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""


# Single import point for all settings
settings = Settings()
