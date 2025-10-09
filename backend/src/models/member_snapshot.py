"""
Member Snapshot Pydantic models

符合 CLAUDE.md: snake_case naming, type hints, Google-style docstrings
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class MemberSnapshotBase(BaseModel):
    """Base member snapshot model with common fields"""

    # Member attributes (may change over time)
    member_name: str = Field(..., min_length=1, max_length=100, description="Member name")
    state: str = Field(..., max_length=50, description="State/territory (所屬州)")
    group_name: str | None = Field(None, max_length=50, description="Group name (分組)")

    # Ranking and power
    contribution_rank: int = Field(..., ge=1, description="Contribution ranking")
    power_value: int = Field(..., ge=0, description="Power value (勢力值)")

    # Weekly performance data
    weekly_contribution: int = Field(0, ge=0, description="Weekly contribution")
    weekly_merit: int = Field(0, ge=0, description="Weekly merit (戰功)")
    weekly_assist: int = Field(0, ge=0, description="Weekly assist (助攻)")
    weekly_donation: int = Field(0, ge=0, description="Weekly donation (捐獻)")

    # Cumulative total data
    total_contribution: int = Field(0, ge=0, description="Total contribution")
    total_merit: int = Field(0, ge=0, description="Total merit")
    total_assist: int = Field(0, ge=0, description="Total assist")
    total_donation: int = Field(0, ge=0, description="Total donation")


class MemberSnapshotCreate(MemberSnapshotBase):
    """Member snapshot creation model"""

    csv_upload_id: UUID = Field(..., description="CSV upload ID")
    member_id: UUID = Field(..., description="Member ID")
    alliance_id: UUID = Field(..., description="Alliance ID")


class MemberSnapshot(MemberSnapshotBase):
    """Member snapshot model with all fields"""

    id: UUID
    csv_upload_id: UUID
    member_id: UUID
    alliance_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class MemberSnapshotWithDetails(MemberSnapshot):
    """Member snapshot with related data for display"""

    snapshot_date: datetime | None = Field(None, description="Snapshot date from CSV upload")
    season_name: str | None = Field(None, description="Season name")
