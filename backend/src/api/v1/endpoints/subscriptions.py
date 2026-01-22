"""
Subscription API Endpoints

API layer for subscription status and management.
符合 CLAUDE.md 🔴:
- API layer delegates to Service layer
- Uses Provider Pattern for dependency injection
- Uses @router.get("") pattern (no trailing slash)
"""

from fastapi import APIRouter

from src.core.dependencies import SubscriptionServiceDep, UserIdDep
from src.models.alliance import SubscriptionStatusResponse

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    service: SubscriptionServiceDep,
    user_id: UserIdDep,
):
    """
    Get current user's alliance subscription status.

    Returns detailed information about the subscription/trial status including:
    - Current status (trial, active, expired, cancelled)
    - Whether write operations are allowed
    - Days remaining in trial/subscription
    - Trial and subscription end dates
    """
    return await service.get_subscription_status(user_id)
