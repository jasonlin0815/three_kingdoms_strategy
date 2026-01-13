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

from src.models.contribution import ContributionType

# ============================================================================
# Request Schemas
# ============================================================================


class CreateContributionRequest(BaseModel):
    """Request body for creating a new contribution event"""

    title: str = Field(..., min_length=1, max_length=100, description="Event title")
    type: ContributionType = Field(..., description="Alliance or punishment type")
    deadline: datetime = Field(..., description="Deadline datetime")
    target_contribution: int = Field(
        0, ge=0, description="Default target for all members (alliance type)"
    )


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
    target_contribution: int
    created_at: datetime
    created_by: UUID | None


class ContributionInfoResponse(BaseModel):
    """Member contribution info"""

    member_id: UUID
    member_name: str
    contribution_target: int
    contribution_made: int


class ContributionDetailResponse(BaseModel):
    """Contribution event with member contribution details"""

    id: UUID
    season_id: UUID
    alliance_id: UUID
    title: str
    type: ContributionType
    deadline: datetime
    target_contribution: int
    created_at: datetime
    created_by: UUID | None
    contribution_info: list[ContributionInfoResponse]


class ContributionTargetOverrideRequest(BaseModel):
    """Request body for per-member target override"""

    member_id: UUID = Field(..., description="Member UUID")
    target_contribution: int = Field(
        ..., ge=0, description="Override target amount for the member"
    )
