"""
Pending Invitation Repository

符合 CLAUDE.md:
- 🔴 Inherits from SupabaseRepository
- 🔴 Uses _handle_supabase_result() for all queries
- 🔴 Never accesses result.data directly
"""

from uuid import UUID

from src.models.pending_invitation import PendingInvitation
from src.repositories.base import SupabaseRepository


class PendingInvitationRepository(SupabaseRepository[PendingInvitation]):
    """
    Repository for managing pending alliance invitations.

    Handles invitations to users who may not be registered yet.
    """

    def __init__(self):
        super().__init__(table_name="pending_invitations", model_class=PendingInvitation)

    async def create_invitation(
        self,
        alliance_id: UUID,
        invited_email: str,
        invited_by: UUID,
        role: str = "member",
    ) -> PendingInvitation:
        """
        Create a new pending invitation.

        Args:
            alliance_id: Alliance UUID
            invited_email: Email of user to invite
            invited_by: UUID of user creating invitation
            role: Role to assign (default: "member")

        Returns:
            PendingInvitation instance

        Raises:
            HTTPException: If creation fails
        """
        data = {
            "alliance_id": str(alliance_id),
            "invited_email": invited_email.lower(),
            "invited_by": str(invited_by),
            "role": role,
            "status": "pending",
        }

        result = await self._execute_async(
            lambda: self.client.from_(self.table_name).insert(data).execute()
        )
        data_dict = self._handle_supabase_result(result, expect_single=True)
        return self._build_model(data_dict)

    async def get_pending_by_email(self, email: str) -> list[PendingInvitation]:
        """
        Get all pending invitations for an email address.

        Args:
            email: Email address to search

        Returns:
            List of pending invitations
        """
        result = await self._execute_async(
            lambda: self.client.from_(self.table_name)
            .select("*")
            .eq("invited_email", email.lower())
            .eq("status", "pending")
            .execute()
        )
        data_list = self._handle_supabase_result(result, allow_empty=True)
        return self._build_models(data_list)

    async def get_alliance_invitations(self, alliance_id: UUID) -> list[PendingInvitation]:
        """
        Get all pending invitations for an alliance.

        Args:
            alliance_id: Alliance UUID

        Returns:
            List of pending invitations
        """
        result = await self._execute_async(
            lambda: self.client.from_(self.table_name)
            .select("*")
            .eq("alliance_id", str(alliance_id))
            .eq("status", "pending")
            .order("invited_at", desc=True)
            .execute()
        )
        data_list = self._handle_supabase_result(result, allow_empty=True)
        return self._build_models(data_list)

    async def mark_as_accepted(self, invitation_id: UUID) -> PendingInvitation:
        """
        Mark invitation as accepted.

        Args:
            invitation_id: Invitation UUID

        Returns:
            Updated invitation

        Raises:
            HTTPException: If update fails
        """
        result = await self._execute_async(
            lambda: self.client.from_(self.table_name)
            .update({"status": "accepted", "accepted_at": "now()"})
            .eq("id", str(invitation_id))
            .execute()
        )
        data_dict = self._handle_supabase_result(result, expect_single=True)
        return self._build_model(data_dict)

    async def revoke_invitation(self, invitation_id: UUID) -> bool:
        """
        Revoke (cancel) a pending invitation.

        Args:
            invitation_id: Invitation UUID

        Returns:
            True if successful

        Raises:
            HTTPException: If revoke fails
        """
        result = await self._execute_async(
            lambda: self.client.from_(self.table_name)
            .update({"status": "revoked"})
            .eq("id", str(invitation_id))
            .execute()
        )
        self._handle_supabase_result(result, expect_single=True)
        return True

    async def check_existing_invitation(
        self, alliance_id: UUID, email: str
    ) -> PendingInvitation | None:
        """
        Check if there's already a pending invitation for this email in this alliance.

        Args:
            alliance_id: Alliance UUID
            email: Email address

        Returns:
            PendingInvitation if exists, None otherwise
        """
        result = await self._execute_async(
            lambda: self.client.from_(self.table_name)
            .select("*")
            .eq("alliance_id", str(alliance_id))
            .eq("invited_email", email.lower())
            .eq("status", "pending")
            .execute()
        )
        data_list = self._handle_supabase_result(result, allow_empty=True)
        if not data_list:
            return None
        return self._build_model(data_list[0])
