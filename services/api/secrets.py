"""
DeepTrace — Secrets Manager
Local dev: reads from .env via config.
Production (Render): reads from environment variables set in Render dashboard.
Future: can add Vault, AWS Secrets Manager, etc.
"""

from services.api.config import settings


def get_gemini_api_key() -> str:
    """Retrieve the Gemini API key. Never hardcoded, always from env."""
    key = settings.gemini_api_key
    if not key:
        raise RuntimeError(
            "GEMINI_API_KEY not set. "
            "Add it to .env (local) or Render environment variables (prod)."
        )
    return key
