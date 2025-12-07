"""
Hegemony Weights API Endpoints

API layer for hegemony weight configuration and score calculation.
符合 CLAUDE.md 🔴:
- API layer delegates to Service layer
- Uses Provider Pattern for dependency injection
- Uses @router.get("") pattern (no trailing slash)
- Specific routes (/initialize, /summary, /preview) MUST come before parametric routes (/{weight_id})
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from src.core.auth import get_current_user_id
from src.core.dependencies import get_hegemony_weight_service
from src.models.hegemony_weight import (
    HegemonyScorePreview,
    HegemonyWeight,
    HegemonyWeightCreate,
    HegemonyWeightUpdate,
    HegemonyWeightWithSnapshot,
    SnapshotWeightsSummary,
)
from src.services.hegemony_weight_service import HegemonyWeightService

router = APIRouter(prefix="/hegemony-weights", tags=["hegemony-weights"])


# =============================================================================
# Static Routes (MUST come before parametric routes like /{weight_id})
# 符合 CLAUDE.md 🔴: Specific routes MUST come before parametric routes
# =============================================================================


@router.post("/initialize", response_model=list[HegemonyWeight])
async def initialize_season_weights(
    service: Annotated[HegemonyWeightService, Depends(get_hegemony_weight_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    season_id: UUID = Query(..., description="Season UUID"),
):
    """
    Initialize default hegemony weight configurations for all CSV uploads in a season.

    Creates weight configurations with default tier 1 weights and even distribution
    of tier 2 weights across all snapshots.
    """
    try:
        return await service.initialize_weights_for_season(user_id, season_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get("/summary", response_model=SnapshotWeightsSummary)
async def get_weights_summary(
    service: Annotated[HegemonyWeightService, Depends(get_hegemony_weight_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    season_id: UUID = Query(..., description="Season UUID"),
):
    """Get summary of all snapshot weights for a season with validation status."""
    try:
        return await service.get_weights_summary(user_id, season_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get("/preview", response_model=list[HegemonyScorePreview])
async def preview_hegemony_scores(
    service: Annotated[HegemonyWeightService, Depends(get_hegemony_weight_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    season_id: UUID = Query(..., description="Season UUID"),
    limit: int = Query(default=20, ge=1, le=500, description="Top N members to return"),
):
    """Calculate and preview hegemony scores for top members."""
    try:
        return await service.calculate_hegemony_scores(user_id, season_id, limit)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


# =============================================================================
# Collection Routes (root path)
# =============================================================================


@router.get("", response_model=list[HegemonyWeightWithSnapshot])
async def get_season_weights(
    service: Annotated[HegemonyWeightService, Depends(get_hegemony_weight_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    season_id: UUID = Query(..., description="Season UUID"),
):
    """Get all hegemony weight configurations for a season."""
    try:
        return await service.get_season_weights(user_id, season_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.post("", response_model=HegemonyWeight, status_code=201)
async def create_weight(
    data: HegemonyWeightCreate,
    service: Annotated[HegemonyWeightService, Depends(get_hegemony_weight_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    season_id: UUID = Query(..., description="Season UUID"),
):
    """Create a new hegemony weight configuration."""
    if not data.validate_indicator_weights_sum():
        raise HTTPException(
            status_code=400,
            detail="Tier 1 weights must sum to 1.0",
        )

    try:
        return await service.create_weight(user_id, season_id, data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


# =============================================================================
# Parametric Routes (/{weight_id}) - MUST come after static routes
# =============================================================================


@router.patch("/{weight_id}", response_model=HegemonyWeight)
async def update_weight(
    weight_id: UUID,
    data: HegemonyWeightUpdate,
    service: Annotated[HegemonyWeightService, Depends(get_hegemony_weight_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
):
    """Update an existing hegemony weight configuration."""
    try:
        return await service.update_weight(user_id, weight_id, data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.delete("/{weight_id}", status_code=204)
async def delete_weight(
    weight_id: UUID,
    service: Annotated[HegemonyWeightService, Depends(get_hegemony_weight_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
):
    """Delete a hegemony weight configuration."""
    try:
        await service.delete_weight(user_id, weight_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
