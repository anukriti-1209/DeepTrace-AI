"""
DeepTrace — Configuration
Reads all settings from environment variables / .env file.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    environment: str = "development"  # development | production
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # Gemini
    gemini_api_key: Optional[str] = None

    # Database
    database_url: str = "sqlite:///./deeptrace.db"

    # Future: Render PostgreSQL, Redis, etc.
    redis_url: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
