"""
Modern authentication dependencies for FastAPI with Supabase JWT.

This module provides high-performance, type-safe authentication dependencies
using local JWT validation instead of API calls to Supabase.
"""

from uuid import UUID

from fastapi import Depends, Header

from src.models.user import AuthenticatedUser, UserSession
from src.services.auth_service import AuthService, get_auth_service


async def get_current_user(
    authorization: str | None = Header(None, alias="Authorization"),
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthenticatedUser:
    """
    Get current authenticated user from JWT token.

    This is the main dependency for protected endpoints.
    Uses local JWT validation for maximum performance.

    Args:
        authorization: Authorization header value
        auth_service: Authentication service instance

    Returns:
        Authenticated user model with validated data

    Raises:
        HTTPException: If authentication fails
    """
    return auth_service.authenticate_user(authorization)


async def get_current_user_id(
    user: AuthenticatedUser = Depends(get_current_user),
) -> UUID:
    """
    Get current user ID as UUID.

    Lightweight dependency that extracts UUID from authenticated user.
    No additional token validation needed.

    Args:
        user: Authenticated user from get_current_user dependency

    Returns:
        User ID as UUID
    """
    return user.id


async def get_current_user_session(
    authorization: str | None = Header(None, alias="Authorization"),
    auth_service: AuthService = Depends(get_auth_service),
) -> UserSession:
    """
    Get current user session with token information.

    Use this when you need token metadata (expiration, session ID, etc.)
    in addition to user data.

    Args:
        authorization: Authorization header value
        auth_service: Authentication service instance

    Returns:
        User session with token information

    Raises:
        HTTPException: If authentication fails
    """
    return auth_service.authenticate_user_session(authorization)


async def get_current_user_optional(
    authorization: str | None = Header(None, alias="Authorization"),
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthenticatedUser | None:
    """
    Get current user if authenticated, None otherwise.

    Use this for endpoints that work with or without authentication.

    Args:
        authorization: Authorization header value
        auth_service: Authentication service instance

    Returns:
        Authenticated user or None
    """
    return auth_service.authenticate_optional(authorization)
