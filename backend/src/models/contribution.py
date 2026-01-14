"""
Contribution Pydantic models

捐獻事件：追蹤同盟捐獻與懲罰事件

符合 CLAUDE.md: snake_case naming, type hints, Google-style docstrings
"""

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ContributionType(str, Enum):
    """Contribution event type"""

    REGULAR = "regular"  # 一般捐獻 - unified target
    PENALTY = "penalty"  # 懲罰性捐獻 - individual targets


class ContributionStatus(str, Enum):
    """Contribution event status"""

    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ContributionBase(BaseModel):
    """Base contribution event model"""

    title: str = Field(..., min_length=1, max_length=100, description="Event title")
    type: ContributionType = Field(..., description="Regular or penalty type")
    description: str | None = Field(None, description="Event description")
    deadline: datetime = Field(..., description="Deadline datetime")
    target_amount: int = Field(
        0, ge=0, description="Default target for all members (regular type)"
    )
    status: ContributionStatus = Field(
        default=ContributionStatus.ACTIVE, description="Event status"
    )


class ContributionCreate(ContributionBase):
    """Contribution event creation model"""

    season_id: UUID = Field(..., description="Season ID")
    alliance_id: UUID = Field(..., description="Alliance ID")
    created_by: UUID | None = Field(None, description="User ID who created this")


class Contribution(ContributionBase):
    """Contribution event model with all fields"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    alliance_id: UUID
    season_id: UUID
    created_by: UUID | None
    created_at: datetime
    updated_at: datetime


class ContributionInfo(BaseModel):
    """Individual member contribution info"""

    member_id: UUID = Field(..., description="Member UUID")
    member_name: str = Field(..., description="Member name")
    target_amount: int = Field(..., description="Target amount")
    contribution_made: int = Field(..., description="Actual contribution (diff)")


class ContributionWithInfo(Contribution):
    """Contribution event with member contribution details"""

    contribution_info: list[ContributionInfo] = Field(
        default_factory=list, description="List of member contributions"
    )


class ContributionTarget(BaseModel):
    """Per-member target override for a contribution event"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID | None = Field(None, description="Target override ID")
    donation_event_id: UUID = Field(..., description="Donation event ID")
    alliance_id: UUID = Field(..., description="Alliance ID")
    member_id: UUID = Field(..., description="Member UUID")
    target_amount: int = Field(..., ge=0, description="Override target amount")
    created_at: datetime | None = Field(
        default=None, description="Timestamp when override was created"
    )
    updated_at: datetime | None = Field(
        default=None, description="Timestamp when override was updated"
    )
