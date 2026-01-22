"""
Subscription Service

符合 CLAUDE.md:
- 🔴 Service Layer: Business logic for subscription checking
- 🔴 NO direct database calls (use Repository)
- 🟡 Exception chaining with 'from e'
"""

import logging
from datetime import UTC, datetime
from uuid import UUID

from src.core.exceptions import SubscriptionExpiredError
from src.models.alliance import Alliance, SubscriptionStatusResponse
from src.repositories.alliance_repository import AllianceRepository

logger = logging.getLogger(__name__)


class SubscriptionService:
    """
    Subscription service for managing trial/subscription status.

    Handles checking subscription validity and enforcing write access restrictions
    when trials expire.
    """

    def __init__(self):
        """Initialize subscription service with repository"""
        self._alliance_repo = AllianceRepository()

    async def get_alliance_by_user(self, user_id: UUID) -> Alliance | None:
        """
        Get alliance for a user.

        Args:
            user_id: User UUID

        Returns:
            Alliance if found, None otherwise
        """
        return await self._alliance_repo.get_by_collaborator(user_id)

    async def get_alliance_by_id(self, alliance_id: UUID) -> Alliance | None:
        """
        Get alliance by ID.

        Args:
            alliance_id: Alliance UUID

        Returns:
            Alliance if found, None otherwise
        """
        return await self._alliance_repo.get_by_id(alliance_id)

    def _calculate_subscription_status(self, alliance: Alliance) -> SubscriptionStatusResponse:
        """
        Calculate detailed subscription status for an alliance.

        Args:
            alliance: Alliance model

        Returns:
            SubscriptionStatusResponse with full status details
        """
        now = datetime.now(UTC)
        status = alliance.subscription_status

        # Determine trial status
        is_trial = status == "trial"
        is_trial_active = False
        trial_days_remaining: int | None = None

        if is_trial and alliance.trial_ends_at:
            trial_end = alliance.trial_ends_at
            # Ensure timezone-aware comparison
            if trial_end.tzinfo is None:
                trial_end = trial_end.replace(tzinfo=UTC)

            if now < trial_end:
                is_trial_active = True
                delta = trial_end - now
                trial_days_remaining = delta.days

        # Determine subscription status
        is_subscription_active = status == "active"
        subscription_days_remaining: int | None = None

        if is_subscription_active and alliance.subscription_ends_at:
            sub_end = alliance.subscription_ends_at
            if sub_end.tzinfo is None:
                sub_end = sub_end.replace(tzinfo=UTC)

            if now < sub_end:
                delta = sub_end - now
                subscription_days_remaining = delta.days
            else:
                # Subscription expired
                is_subscription_active = False

        # Overall active status: either trial is active OR subscription is active
        is_active = is_trial_active or is_subscription_active

        # Calculate days remaining (prioritize subscription over trial)
        days_remaining = subscription_days_remaining if is_subscription_active else trial_days_remaining

        return SubscriptionStatusResponse(
            status=status,
            is_active=is_active,
            is_trial=is_trial,
            is_trial_active=is_trial_active,
            days_remaining=days_remaining,
            trial_ends_at=alliance.trial_ends_at.isoformat() if alliance.trial_ends_at else None,
            subscription_plan=alliance.subscription_plan,
            subscription_ends_at=(
                alliance.subscription_ends_at.isoformat()
                if alliance.subscription_ends_at
                else None
            ),
        )

    async def get_subscription_status(self, user_id: UUID) -> SubscriptionStatusResponse:
        """
        Get subscription status for a user's alliance.

        Args:
            user_id: User UUID

        Returns:
            SubscriptionStatusResponse with full status details

        Raises:
            ValueError: If user has no alliance
        """
        alliance = await self.get_alliance_by_user(user_id)

        if not alliance:
            raise ValueError("No alliance found for user")

        return self._calculate_subscription_status(alliance)

    async def get_subscription_status_by_alliance(
        self, alliance_id: UUID
    ) -> SubscriptionStatusResponse:
        """
        Get subscription status for a specific alliance.

        Args:
            alliance_id: Alliance UUID

        Returns:
            SubscriptionStatusResponse with full status details

        Raises:
            ValueError: If alliance not found
        """
        alliance = await self.get_alliance_by_id(alliance_id)

        if not alliance:
            raise ValueError(f"Alliance not found: {alliance_id}")

        return self._calculate_subscription_status(alliance)

    async def check_write_access(self, alliance_id: UUID) -> bool:
        """
        Check if alliance has write access (active trial or subscription).

        Args:
            alliance_id: Alliance UUID

        Returns:
            True if write access is allowed, False otherwise
        """
        try:
            status = await self.get_subscription_status_by_alliance(alliance_id)
            return status.is_active
        except ValueError:
            return False

    async def require_write_access(self, alliance_id: UUID, action: str = "perform this action") -> None:
        """
        Require alliance to have write access.

        Args:
            alliance_id: Alliance UUID
            action: Description of the action being attempted

        Raises:
            SubscriptionExpiredError: If trial/subscription has expired
            ValueError: If alliance not found
        """
        status = await self.get_subscription_status_by_alliance(alliance_id)

        if not status.is_active:
            logger.warning(
                f"Write access denied - alliance_id={alliance_id}, "
                f"status={status.status}, action={action}"
            )

            if status.is_trial:
                message = (
                    f"Your 14-day trial has expired. "
                    f"Please upgrade to continue to {action}."
                )
            else:
                message = (
                    f"Your subscription has expired. "
                    f"Please renew to continue to {action}."
                )

            raise SubscriptionExpiredError(message)
