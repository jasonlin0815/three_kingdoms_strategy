"""
Season API Endpoints

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
from src.core.dependencies import get_season_service
from src.models.season import Season, SeasonCreate, SeasonUpdate
from src.services.season_service import SeasonService

router = APIRouter(prefix="/seasons", tags=["seasons"])


@router.get("", response_model=list[Season])
async def get_seasons(
    service: Annotated[SeasonService, Depends(get_season_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    active_only: bool = False,
):
    """
    Get all seasons for current user's alliance

    Args:
        service: Season service (injected)
        user_id: User UUID (from JWT token)
        active_only: Only return active seasons

    Returns:
        List of season instances

    Raises:
        HTTPException 404: If user has no alliance

    符合 CLAUDE.md 🔴: API layer delegates to service
    """
    try:
        return await service.get_seasons(user_id, active_only=active_only)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get("/active", response_model=Season | None)
async def get_active_season(
    service: Annotated[SeasonService, Depends(get_season_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
):
    """
    Get active season for current user's alliance

    Args:
        service: Season service (injected)
        user_id: User UUID (from JWT token)

    Returns:
        Active season or None if not found

    Raises:
        HTTPException 404: If user has no alliance

    符合 CLAUDE.md 🔴: API layer delegates to service
    """
    try:
        return await service.get_active_season(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get("/{season_id}", response_model=Season)
async def get_season(
    season_id: UUID,
    service: Annotated[SeasonService, Depends(get_season_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
):
    """
    Get specific season by ID

    Args:
        season_id: Season UUID
        service: Season service (injected)
        user_id: User UUID (from JWT token)

    Returns:
        Season instance

    Raises:
        HTTPException 404: If season not found or user has no alliance
        HTTPException 403: If user doesn't own the season

    符合 CLAUDE.md 🔴: API layer delegates to service
    """
    try:
        return await service.get_season(user_id, season_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e


@router.post("", response_model=Season, status_code=201)
async def create_season(
    season_data: SeasonCreate,
    service: Annotated[SeasonService, Depends(get_season_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
):
    """
    Create new season for current user's alliance

    Args:
        season_data: Season creation data
        service: Season service (injected)
        user_id: User UUID (from JWT token)

    Returns:
        Created season instance

    Raises:
        HTTPException 404: If user has no alliance
        HTTPException 403: If alliance_id doesn't match user's alliance

    符合 CLAUDE.md 🔴: API layer delegates to service
    符合 CLAUDE.md 🟡: Exception chaining with 'from e'
    """
    try:
        return await service.create_season(user_id, season_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e


@router.patch("/{season_id}", response_model=Season)
async def update_season(
    season_id: UUID,
    season_data: SeasonUpdate,
    service: Annotated[SeasonService, Depends(get_season_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
):
    """
    Update existing season

    Args:
        season_id: Season UUID
        season_data: Season update data
        service: Season service (injected)
        user_id: User UUID (from JWT token)

    Returns:
        Updated season instance

    Raises:
        HTTPException 404: If season not found or user has no alliance
        HTTPException 403: If user doesn't own the season

    符合 CLAUDE.md 🔴: API layer delegates to service
    符合 CLAUDE.md 🟡: Exception chaining with 'from e'
    """
    try:
        return await service.update_season(user_id, season_id, season_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e


@router.delete("/{season_id}", status_code=204)
async def delete_season(
    season_id: UUID,
    service: Annotated[SeasonService, Depends(get_season_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
):
    """
    Delete season (hard delete, CASCADE will remove related data)

    Args:
        season_id: Season UUID
        service: Season service (injected)
        user_id: User UUID (from JWT token)

    Raises:
        HTTPException 404: If season not found or user has no alliance
        HTTPException 403: If user doesn't own the season

    符合 CLAUDE.md 🔴: API layer delegates to service
    """
    try:
        await service.delete_season(user_id, season_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e


@router.post("/{season_id}/activate", response_model=Season)
async def activate_season(
    season_id: UUID,
    service: Annotated[SeasonService, Depends(get_season_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
):
    """
    Set a season as active (deactivates all other seasons for the alliance)

    Args:
        season_id: Season UUID to activate
        service: Season service (injected)
        user_id: User UUID (from JWT token)

    Returns:
        Updated active season

    Raises:
        HTTPException 404: If season not found or user has no alliance
        HTTPException 403: If user doesn't own the season

    符合 CLAUDE.md 🔴: API layer delegates to service
    """
    try:
        return await service.set_active_season(user_id, season_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e
