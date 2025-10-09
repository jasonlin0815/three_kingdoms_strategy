"""
Database connection and client management

符合 CLAUDE.md: Supabase client singleton
"""

from functools import lru_cache

from supabase import Client, create_client

from src.core.config import settings


@lru_cache
def get_supabase_client() -> Client:
    """
    Get Supabase client singleton

    Returns:
        Supabase client instance

    符合 CLAUDE.md: Singleton pattern with lru_cache
    """
    return create_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_service_key,
    )


# Global client instance
supabase_client = get_supabase_client()
