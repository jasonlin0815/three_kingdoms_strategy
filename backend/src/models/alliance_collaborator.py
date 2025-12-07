"""
Alliance Collaborator Pydantic models

符合 CLAUDE.md:
- 🟡 snake_case for ALL API fields
- 🟢 Google-style docstrings
- 🟢 Type hints
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AllianceCollaboratorBase(BaseModel):
    """Alliance collaborator base model"""

    role: str = Field(default="member", description="Collaborator role (owner/member)")


class AllianceCollaboratorCreate(BaseModel):
    """
    Create alliance collaborator request (by email).

    Client provides email address, backend resolves to user_id.
    """

    email: EmailStr = Field(..., description="Email of user to add as collaborator")
    role: str = Field(default="member", description="Role to assign")


class AllianceCollaboratorDB(BaseModel):
    """Alliance collaborator database model"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    alliance_id: UUID
    user_id: UUID
    role: str
    invited_by: UUID | None
    invited_at: datetime
    joined_at: datetime
    created_at: datetime
    updated_at: datetime


class AllianceCollaboratorResponse(BaseModel):
    """Alliance collaborator API response"""

    model_config = ConfigDict(extra="allow")

    id: UUID
    alliance_id: UUID
    user_id: UUID
    role: str
    invited_by: UUID | None
    joined_at: datetime
    created_at: datetime

    # User info (enriched from Supabase Auth)
    user_email: str | None = None
    user_name: str | None = None  # Deprecated, use user_full_name
    user_full_name: str | None = None  # From Google OAuth (full_name or name)
    user_avatar_url: str | None = None  # From Google OAuth (avatar_url or picture)


class AllianceCollaboratorListResponse(BaseModel):
    """List of alliance collaborators response"""

    collaborators: list[AllianceCollaboratorResponse]
    total: int
