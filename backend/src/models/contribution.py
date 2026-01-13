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

    ALLIANCE = "alliance"  # 同盟捐獻 - unified target
    PUNISHMENT = "punishment"  # 懲罰 - individual targets


class ContributionBase(BaseModel):
    """Base contribution event model"""

    title: str = Field(..., min_length=1, max_length=100, description="Event title")
    type: ContributionType = Field(..., description="Alliance or punishment type")
    deadline: datetime = Field(..., description="Deadline datetime")
    target_contribution: int = Field(
        0, ge=0, description="Default target for all members (alliance type)"
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
    season_id: UUID
    alliance_id: UUID
    created_at: datetime
    created_by: UUID | None


class ContributionInfo(BaseModel):
    """Individual member contribution info"""

    member_id: UUID = Field(..., description="Member UUID")
    member_name: str = Field(..., description="Member name")
    contribution_target: int = Field(..., description="Target amount")
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
    contribution_id: UUID = Field(..., description="Contribution event ID")
    member_id: UUID = Field(..., description="Member UUID")
    target_contribution: int = Field(..., ge=0, description="Override target amount")
    created_at: datetime | None = Field(
        default=None, description="Timestamp when override was created"
    )
