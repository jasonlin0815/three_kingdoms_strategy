"""
Alliance Collaborators API Endpoints

符合 CLAUDE.md:
- 🔴 API Layer: HTTP handling, validation, authentication only
- 🔴 Delegate ALL business logic to Service layer
- 🔴 Use Depends() for dependency injection
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status

from src.core.auth import get_current_user_id
from src.core.database import get_supabase_client
from src.core.dependencies import get_alliance_collaborator_service
from src.models.alliance_collaborator import (
    AllianceCollaboratorCreate,
    AllianceCollaboratorListResponse,
)
from src.services.alliance_collaborator_service import AllianceCollaboratorService

router = APIRouter(tags=["alliance-collaborators"])


@router.post(
    "/alliances/{alliance_id}/collaborators",
    status_code=status.HTTP_201_CREATED,
    summary="Add collaborator to alliance",
)
async def add_alliance_collaborator(
    alliance_id: UUID,
    data: AllianceCollaboratorCreate,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[
        AllianceCollaboratorService, Depends(get_alliance_collaborator_service)
    ],
):
    """
    Add a collaborator to alliance by email.

    Now supports inviting users who haven't registered yet!

    Requirements:
    - Current user must be a collaborator of the alliance
    - If email is registered: Add user immediately
    - If email not registered: Create pending invitation (auto-accept on registration)

    Returns:
    - 201: Collaborator added successfully OR invitation created
    - 403: Not a collaborator of alliance
    - 409: User already a collaborator OR invitation already exists

    符合 CLAUDE.md 🔴: API layer delegates to service
    """
    return await service.add_collaborator_by_email(
        current_user_id=current_user_id, alliance_id=alliance_id, email=data.email
    )


@router.get(
    "/alliances/{alliance_id}/collaborators",
    response_model=AllianceCollaboratorListResponse,
    summary="Get alliance collaborators",
)
async def get_alliance_collaborators(
    alliance_id: UUID,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[
        AllianceCollaboratorService, Depends(get_alliance_collaborator_service)
    ],
):
    """
    Get all collaborators of an alliance.

    Returns:
    - 200: List of collaborators
    - 403: Not a collaborator of alliance

    符合 CLAUDE.md 🔴: API layer delegates to service
    """
    collaborators = await service.get_alliance_collaborators(
        current_user_id, alliance_id
    )
    return AllianceCollaboratorListResponse(
        collaborators=collaborators, total=len(collaborators)
    )


@router.delete(
    "/alliances/{alliance_id}/collaborators/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove collaborator from alliance",
)
async def remove_alliance_collaborator(
    alliance_id: UUID,
    user_id: UUID,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[
        AllianceCollaboratorService, Depends(get_alliance_collaborator_service)
    ],
):
    """
    Remove a collaborator from alliance.

    Restrictions:
    - Cannot remove alliance owner
    - Cannot remove yourself

    Returns:
    - 204: Collaborator removed successfully
    - 400: Invalid operation (e.g., removing self)
    - 403: Permission denied

    符合 CLAUDE.md 🔴: API layer delegates to service
    """
    await service.remove_collaborator(current_user_id, alliance_id, user_id)
    return None


@router.post(
    "/collaborators/process-invitations",
    status_code=status.HTTP_200_OK,
    summary="Process pending invitations for current user",
)
async def process_pending_invitations(
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[
        AllianceCollaboratorService, Depends(get_alliance_collaborator_service)
    ],
):
    """
    Process all pending invitations for the authenticated user.

    Should be called after user login to automatically add them to
    alliances they were invited to before registration.

    Returns:
    - 200: Number of invitations processed
    - 401: Not authenticated

    符合 CLAUDE.md 🔴: API layer delegates to service
    """
    # Get user email from Supabase Auth
    supabase = get_supabase_client()
    user = supabase.auth.admin.get_user_by_id(str(current_user_id))

    if not user or not user.user.email:
        return {"processed_count": 0, "message": "User email not found"}

    processed_count = await service.process_pending_invitations(
        current_user_id, user.user.email
    )

    return {
        "processed_count": processed_count,
        "message": f"Processed {processed_count} pending invitations",
    }
