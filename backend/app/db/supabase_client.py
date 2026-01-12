"""
Supabase client wrapper for database operations.
"""

from supabase import create_client, Client
from app.config import settings


def get_supabase_client() -> Client:
    """
    Create and return a Supabase client instance.

    Uses service role key for server-side operations with full access.
    """
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )


# Singleton client instance
_client: Client | None = None


def get_client() -> Client:
    """Get or create the Supabase client singleton."""
    global _client
    if _client is None:
        _client = get_supabase_client()
    return _client
