"""
Contributions API Schemas

Request/Response models for contribution event endpoints.

Follows CLAUDE.md:
- Pydantic V2 syntax
- snake_case naming
- Clear type hints
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.models.contribution import ContributionStatus, ContributionType

# ============================================================================
# Request Schemas
# ============================================================================


class CreateContributionRequest(BaseModel):
    """Request body for creating a new contribution event"""

    title: str = Field(..., min_length=1, max_length=100, description="Event title")
    type: ContributionType = Field(..., description="Regular or penalty type")
    deadline: datetime = Field(..., description="Deadline datetime")
    target_amount: int = Field(
        0, ge=0, description="Default target for all members (regular type)"
    )
    description: str | None = Field(None, description="Optional event description")


# ============================================================================
# Response Schemas
# ============================================================================


class ContributionListResponse(BaseModel):
    """Contribution event for list display"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    season_id: UUID
    alliance_id: UUID
    title: str
    type: ContributionType
    deadline: datetime
    target_amount: int
    description: str | None
    status: ContributionStatus
    created_at: datetime
    created_by: UUID | None
    updated_at: datetime


class ContributionInfoResponse(BaseModel):
    """Member contribution info"""

    member_id: UUID
    member_name: str
    target_amount: int
    contribution_made: int


class ContributionDetailResponse(BaseModel):
    """Contribution event with member contribution details"""

    id: UUID
    season_id: UUID
    alliance_id: UUID
    title: str
    type: ContributionType
    deadline: datetime
    target_amount: int
    description: str | None
    status: ContributionStatus
    created_at: datetime
    created_by: UUID | None
    updated_at: datetime
    contribution_info: list[ContributionInfoResponse]


class ContributionTargetOverrideRequest(BaseModel):
    """Request body for per-member target override"""

    member_id: UUID = Field(..., description="Member UUID")
    target_amount: int = Field(
        ..., ge=0, description="Override target amount for the member"
    )
