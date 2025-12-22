"""
Events API Endpoints

Battle event analytics endpoints.

Follows CLAUDE.md:
- API layer delegates to Service layer
- Uses Annotated dependency injection
- Proper error handling with exception chaining
- Typed response models for OpenAPI docs
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from src.api.v1.schemas.events import (
    CreateEventRequest,
    DistributionBinResponse,
    EventAnalyticsResponse,
    EventDetailResponse,
    EventListItemResponse,
    EventMemberMetricResponse,
    EventSummaryResponse,
    ProcessEventRequest,
)
from src.core.auth import get_current_user_id
from src.models.battle_event import BattleEventCreate
from src.repositories.battle_event_repository import BattleEventRepository
from src.repositories.season_repository import SeasonRepository
from src.services.battle_event_service import BattleEventService
from src.services.permission_service import PermissionService

router = APIRouter(prefix="/events", tags=["events"])

# Type aliases for dependency injection
CurrentUserIdDep = Annotated[UUID, Depends(get_current_user_id)]


def get_event_service() -> BattleEventService:
    """Get battle event service instance"""
    return BattleEventService()


EventServiceDep = Annotated[BattleEventService, Depends(get_event_service)]


async def _verify_season_access(user_id: UUID, season_id: UUID) -> UUID:
    """
    Verify user has access to the season and return alliance_id.
    Raises HTTPException if not authorized.
    """
    season_repo = SeasonRepository()
    season = await season_repo.get_by_id(season_id)

    if not season:
        raise HTTPException(status_code=404, detail="Season not found")

    permission_service = PermissionService()
    role = await permission_service.get_user_role(user_id, season.alliance_id)

    if role is None:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this alliance",
        )

    return season.alliance_id


async def _verify_event_access(user_id: UUID, event_id: UUID) -> UUID:
    """
    Verify user has access to the event and return alliance_id.
    Raises HTTPException if not authorized.
    """
    event_repo = BattleEventRepository()
    event = await event_repo.get_by_id(event_id)

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    permission_service = PermissionService()
    role = await permission_service.get_user_role(user_id, event.alliance_id)

    if role is None:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this alliance",
        )

    return event.alliance_id


@router.get("", response_model=list[EventListItemResponse])
async def list_events(
    season_id: UUID,
    user_id: CurrentUserIdDep,
    service: EventServiceDep,
) -> list[EventListItemResponse]:
    """
    Get all events for a season.

    Query Parameters:
        season_id: Season UUID (required)

    Returns:
        List of events with basic info and computed stats
    """
    await _verify_season_access(user_id, season_id)
    events = await service.get_events_by_season(season_id)
    return [EventListItemResponse.model_validate(e) for e in events]


@router.post("", response_model=EventDetailResponse, status_code=201)
async def create_event(
    season_id: UUID,
    body: CreateEventRequest,
    user_id: CurrentUserIdDep,
    service: EventServiceDep,
) -> EventDetailResponse:
    """
    Create a new battle event.

    Query Parameters:
        season_id: Season UUID (required)

    Request Body:
        name: Event name
        event_type: Type of event
        description: Optional description

    Returns:
        Created event details
    """
    alliance_id = await _verify_season_access(user_id, season_id)

    event_data = BattleEventCreate(
        season_id=season_id,
        alliance_id=alliance_id,
        name=body.name,
        event_type=body.event_type,
        description=body.description,
        created_by=user_id,
    )

    event = await service.create_event(event_data)
    return EventDetailResponse.model_validate(event)


@router.get("/{event_id}", response_model=EventDetailResponse)
async def get_event(
    event_id: UUID,
    user_id: CurrentUserIdDep,
    service: EventServiceDep,
) -> EventDetailResponse:
    """
    Get event details by ID.

    Path Parameters:
        event_id: Event UUID

    Returns:
        Event details
    """
    await _verify_event_access(user_id, event_id)
    event = await service.get_event(event_id)

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    return EventDetailResponse.model_validate(event)


@router.post("/{event_id}/process", response_model=EventDetailResponse)
async def process_event(
    event_id: UUID,
    body: ProcessEventRequest,
    user_id: CurrentUserIdDep,
    service: EventServiceDep,
) -> EventDetailResponse:
    """
    Process event snapshots and calculate metrics.

    This endpoint should be called after uploading before/after CSV files.
    It calculates member participation and metrics.

    Path Parameters:
        event_id: Event UUID

    Request Body:
        before_upload_id: Before snapshot upload UUID
        after_upload_id: After snapshot upload UUID

    Returns:
        Updated event details with completed status
    """
    await _verify_event_access(user_id, event_id)

    try:
        event = await service.process_event_snapshots(
            event_id, body.before_upload_id, body.after_upload_id
        )
        return EventDetailResponse.model_validate(event)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/{event_id}/summary", response_model=EventSummaryResponse)
async def get_event_summary(
    event_id: UUID,
    user_id: CurrentUserIdDep,
    service: EventServiceDep,
) -> EventSummaryResponse:
    """
    Get event summary statistics.

    Path Parameters:
        event_id: Event UUID

    Returns:
        Event summary with participation stats and aggregates
    """
    await _verify_event_access(user_id, event_id)
    summary = await service.get_event_summary(event_id)
    return EventSummaryResponse.model_validate(summary)


@router.get("/{event_id}/metrics", response_model=list[EventMemberMetricResponse])
async def get_event_metrics(
    event_id: UUID,
    user_id: CurrentUserIdDep,
    service: EventServiceDep,
) -> list[EventMemberMetricResponse]:
    """
    Get all member metrics for an event.

    Path Parameters:
        event_id: Event UUID

    Returns:
        List of member metrics ordered by merit_diff descending
    """
    await _verify_event_access(user_id, event_id)
    metrics = await service.get_event_metrics(event_id)
    return [EventMemberMetricResponse.model_validate(m) for m in metrics]


@router.get("/{event_id}/analytics", response_model=EventAnalyticsResponse)
async def get_event_analytics(
    event_id: UUID,
    user_id: CurrentUserIdDep,
    service: EventServiceDep,
) -> EventAnalyticsResponse:
    """
    Get complete event analytics.

    Path Parameters:
        event_id: Event UUID

    Returns:
        Complete analytics with event, summary, metrics, and distribution
    """
    await _verify_event_access(user_id, event_id)

    event = await service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    summary = await service.get_event_summary(event_id)
    metrics = await service.get_event_metrics(event_id)

    # Calculate merit distribution
    merit_distribution = _calculate_merit_distribution([m.merit_diff for m in metrics])

    return EventAnalyticsResponse(
        event=EventDetailResponse.model_validate(event),
        summary=EventSummaryResponse.model_validate(summary),
        metrics=[EventMemberMetricResponse.model_validate(m) for m in metrics],
        merit_distribution=merit_distribution,
    )


@router.delete("/{event_id}", status_code=204)
async def delete_event(
    event_id: UUID,
    user_id: CurrentUserIdDep,
    service: EventServiceDep,
) -> None:
    """
    Delete an event.

    Path Parameters:
        event_id: Event UUID
    """
    await _verify_event_access(user_id, event_id)
    await service.delete_event(event_id)


def _calculate_merit_distribution(merits: list[int]) -> list[DistributionBinResponse]:
    """
    Calculate dynamic merit distribution bins.

    Args:
        merits: List of merit diff values

    Returns:
        List of distribution bins
    """
    if not merits:
        return []

    # Filter out zeros for better distribution
    positive_merits = [m for m in merits if m > 0]
    if not positive_merits:
        return [DistributionBinResponse(range="0", count=len(merits))]

    min_val = min(positive_merits)
    max_val = max(positive_merits)

    # Handle edge case where all values are the same
    if min_val == max_val:
        return [DistributionBinResponse(range=_format_value(min_val), count=len(positive_merits))]

    # Calculate nice bin width
    data_range = max_val - min_val
    raw_bin_width = data_range / 5  # Target 5 bins

    # Round to nice numbers
    magnitude = 10 ** max(0, len(str(int(raw_bin_width))) - 1) if raw_bin_width >= 1 else 1
    nice_widths = [1, 2, 5, 10, 20, 50, 100]
    bin_width = int(magnitude * min(nice_widths, key=lambda x: abs(x * magnitude - raw_bin_width)))
    bin_width = max(bin_width, 1000)  # Minimum 1K bins

    # Calculate bin start
    bin_start = (min_val // bin_width) * bin_width

    # Create bins
    bins: list[dict] = []
    current = bin_start
    while current < max_val:
        next_val = current + bin_width
        bins.append({
            "range": f"{_format_value(current)}-{_format_value(next_val)}",
            "min_value": current,
            "max_value": next_val,
            "count": 0,
        })
        current = next_val

    # Count values in each bin
    for merit in positive_merits:
        for bin_data in bins:
            if bin_data["min_value"] <= merit < bin_data["max_value"]:
                bin_data["count"] += 1
                break
        else:
            if bins and merit >= bins[-1]["min_value"]:
                bins[-1]["count"] += 1

    # Add zero count if any
    zero_count = sum(1 for m in merits if m == 0)
    result = []
    if zero_count > 0:
        result.append(DistributionBinResponse(range="0", count=zero_count))

    result.extend([DistributionBinResponse(range=b["range"], count=b["count"]) for b in bins])
    return result


def _format_value(val: int) -> str:
    """Format value with K/M suffix."""
    if val >= 1_000_000:
        return f"{val / 1_000_000:.1f}M" if val % 1_000_000 != 0 else f"{val // 1_000_000}M"
    if val >= 1000:
        return f"{val / 1000:.0f}K" if val % 1000 == 0 else f"{val / 1000:.1f}K"
    return str(val)
