"""
Alliance Pydantic models

符合 CLAUDE.md: snake_case naming, type hints, Google-style docstrings
"""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# Subscription status type
SubscriptionStatus = Literal["trial", "active", "expired", "cancelled"]


class AllianceBase(BaseModel):
    """Base alliance model with common fields"""

    name: str = Field(..., min_length=1, max_length=100, description="Alliance name")
    server_name: str | None = Field(None, max_length=100, description="Game server name")


class AllianceCreate(AllianceBase):
    """
    Alliance creation model (Client-side)

    Note: user_id is NOT included here - it's extracted from JWT token on the server.
    符合 CLAUDE.md 🔴: Security best practice - never trust client-provided user_id
    """
    pass


class AllianceUpdate(BaseModel):
    """Alliance update model"""

    name: str | None = Field(None, min_length=1, max_length=100)
    server_name: str | None = Field(None, max_length=100)


class Alliance(AllianceBase):
    """
    Alliance model with all fields.

    Note: user_id has been removed - use alliance_collaborators table instead
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime

    # Subscription fields
    subscription_status: SubscriptionStatus = "trial"
    trial_started_at: datetime | None = None
    trial_ends_at: datetime | None = None
    subscription_plan: str | None = None
    subscription_started_at: datetime | None = None
    subscription_ends_at: datetime | None = None


class SubscriptionStatusResponse(BaseModel):
    """Response model for subscription status API"""

    status: SubscriptionStatus
    is_active: bool = Field(description="Whether subscription is active (trial or paid)")
    is_trial: bool = Field(description="Whether currently in trial period")
    is_trial_active: bool = Field(description="Whether trial is still valid")
    days_remaining: int | None = Field(description="Days remaining in trial/subscription")
    trial_ends_at: str | None = Field(description="Trial end date (ISO format)")
    subscription_plan: str | None = Field(description="Current subscription plan name")
    subscription_ends_at: str | None = Field(description="Subscription end date (ISO format)")
