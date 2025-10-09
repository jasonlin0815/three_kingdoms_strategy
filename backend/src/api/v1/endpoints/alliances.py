"""
Alliance API Endpoints

符合 CLAUDE.md 🔴:
- API Layer delegates to Service Layer
- Uses Provider Pattern for dependency injection
- Returns proper HTTP status codes
- JWT authentication required
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from src.core.auth import get_current_user_id
from src.core.dependencies import get_alliance_service
from src.models.alliance import Alliance, AllianceCreate, AllianceUpdate
from src.services.alliance_service import AllianceService

router = APIRouter(prefix="/alliances", tags=["alliances"])


@router.get("", response_model=Alliance | None)
async def get_user_alliance(
    service: Annotated[AllianceService, Depends(get_alliance_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
):
    """
    Get current user's alliance

    Args:
        service: Alliance service (injected)
        user_id: User UUID (from JWT token)

    Returns:
        Alliance instance or None if not found

    符合 CLAUDE.md 🔴: API layer delegates to service
    """
    return await service.get_user_alliance(user_id)


@router.post("", response_model=Alliance, status_code=201)
async def create_alliance(
    alliance_data: AllianceCreate,
    service: Annotated[AllianceService, Depends(get_alliance_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
):
    """
    Create new alliance for current user

    Args:
        alliance_data: Alliance creation data
        service: Alliance service (injected)
        user_id: User UUID (from JWT token)

    Returns:
        Created alliance instance

    Raises:
        HTTPException 400: If user already has an alliance

    符合 CLAUDE.md 🔴: API layer delegates to service
    """
    try:
        # user_id comes from JWT token (符合 CLAUDE.md 🔴: Security - never trust client)
        return await service.create_alliance(user_id, alliance_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.patch("", response_model=Alliance)
async def update_alliance(
    alliance_data: AllianceUpdate,
    service: Annotated[AllianceService, Depends(get_alliance_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
):
    """
    Update current user's alliance

    Args:
        alliance_data: Alliance update data
        service: Alliance service (injected)
        user_id: User UUID (from JWT token)

    Returns:
        Updated alliance instance

    Raises:
        HTTPException 404: If user has no alliance

    符合 CLAUDE.md 🔴: API layer delegates to service
    符合 CLAUDE.md 🟡: Exception chaining with 'from e'
    """
    try:
        return await service.update_alliance(user_id, alliance_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.delete("", status_code=204)
async def delete_alliance(
    service: Annotated[AllianceService, Depends(get_alliance_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
):
    """
    Delete current user's alliance

    Args:
        service: Alliance service (injected)
        user_id: User UUID (from JWT token)

    Raises:
        HTTPException 404: If user has no alliance

    符合 CLAUDE.md 🔴: API layer delegates to service
    """
    try:
        await service.delete_alliance(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
