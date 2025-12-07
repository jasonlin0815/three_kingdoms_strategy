"""
Member Pydantic models

符合 CLAUDE.md: snake_case naming, type hints, Google-style docstrings
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MemberBase(BaseModel):
    """Base member model with common fields"""

    name: str = Field(..., min_length=1, max_length=100, description="Member name (game nickname)")


class MemberCreate(MemberBase):
    """Member creation model"""

    alliance_id: UUID = Field(..., description="Alliance ID")
    first_seen_at: datetime = Field(..., description="First appearance datetime")
    last_seen_at: datetime = Field(..., description="Last appearance datetime")
    is_active: bool = Field(True, description="Whether member is active")


class MemberUpdate(BaseModel):
    """Member update model"""

    last_seen_at: datetime | None = None
    is_active: bool | None = None


class Member(MemberBase):
    """Member model with all fields"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    alliance_id: UUID
    first_seen_at: datetime
    last_seen_at: datetime
    is_active: bool
    created_at: datetime
    updated_at: datetime
