"""
Pending Invitation Models

符合 CLAUDE.md:
- 🟡 snake_case field naming
- 🟢 Explicit type hints
- 🟢 Google-style docstrings
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class PendingInvitation(BaseModel):
    """
    Pending invitation database model.

    Represents an invitation sent to a user who may not be registered yet.
    """

    id: UUID
    alliance_id: UUID
    invited_email: str
    invited_by: UUID
    role: str
    invitation_token: UUID
    invited_at: datetime
    expires_at: datetime
    accepted_at: datetime | None = None
    status: str  # pending, accepted, expired, revoked


class PendingInvitationCreate(BaseModel):
    """
    Create pending invitation request.

    Used when inviting a user who may not be registered.
    """

    email: EmailStr = Field(..., description="Email of user to invite")
    role: str = Field(default="member", description="Role to assign")


class PendingInvitationResponse(BaseModel):
    """
    Pending invitation API response.

    Returns invitation details to the client.
    """

    id: str
    alliance_id: str
    invited_email: str
    invited_by: str
    role: str
    invited_at: str
    expires_at: str
    status: str
    is_pending_registration: bool = Field(
        default=True, description="Indicates this is a pending invitation"
    )


class PendingInvitationListResponse(BaseModel):
    """
    List of pending invitations.

    Used for GET endpoints returning multiple invitations.
    """

    invitations: list[PendingInvitationResponse]
    total: int
