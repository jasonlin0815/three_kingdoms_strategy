"""
Member Repository

符合 CLAUDE.md 🔴:
- Inherits from SupabaseRepository
- Uses _handle_supabase_result() for all queries
"""

from uuid import UUID

from src.models.member import Member
from src.repositories.base import SupabaseRepository


class MemberRepository(SupabaseRepository[Member]):
    """Repository for member data access"""

    def __init__(self):
        """Initialize member repository"""
        super().__init__(table_name="members", model_class=Member)

    async def get_by_alliance(
        self, alliance_id: UUID, active_only: bool = False
    ) -> list[Member]:
        """
        Get members by alliance ID

        Args:
            alliance_id: Alliance UUID
            active_only: Only return active members

        Returns:
            List of member instances

        符合 CLAUDE.md 🔴: Uses _handle_supabase_result()
        """
        query = self.client.from_(self.table_name).select("*").eq("alliance_id", str(alliance_id))

        if active_only:
            query = query.eq("is_active", True)

        result = query.order("name").execute()

        data = self._handle_supabase_result(result, allow_empty=True)

        return self._build_models(data)

    async def get_by_name(self, alliance_id: UUID, name: str) -> Member | None:
        """
        Get member by name within alliance

        Args:
            alliance_id: Alliance UUID
            name: Member name

        Returns:
            Member instance or None if not found

        符合 CLAUDE.md 🔴: Uses _handle_supabase_result()
        """
        result = (
            self.client.from_(self.table_name)
            .select("*")
            .eq("alliance_id", str(alliance_id))
            .eq("name", name)
            .execute()
        )

        data = self._handle_supabase_result(result, allow_empty=True, expect_single=True)

        if not data:
            return None

        return self._build_model(data)

    async def create(self, member_data: dict) -> Member:
        """
        Create new member

        Args:
            member_data: Member data dictionary

        Returns:
            Created member instance

        符合 CLAUDE.md 🔴: Uses _handle_supabase_result()
        """
        result = self.client.from_(self.table_name).insert(member_data).execute()

        data = self._handle_supabase_result(result, expect_single=True)

        return self._build_model(data)

    async def update(self, member_id: UUID, member_data: dict) -> Member:
        """
        Update member

        Args:
            member_id: Member UUID
            member_data: Member data dictionary

        Returns:
            Updated member instance

        符合 CLAUDE.md 🔴: Uses _handle_supabase_result()
        """
        result = (
            self.client.from_(self.table_name)
            .update(member_data)
            .eq("id", str(member_id))
            .execute()
        )

        data = self._handle_supabase_result(result, expect_single=True)

        return self._build_model(data)

    async def upsert_by_name(
        self, alliance_id: UUID, name: str, member_data: dict
    ) -> Member:
        """
        Create or update member by name

        Args:
            alliance_id: Alliance UUID
            name: Member name
            member_data: Member data dictionary

        Returns:
            Member instance

        符合 CLAUDE.md 🔴: Uses _handle_supabase_result()
        """
        # Try to get existing member
        existing = await self.get_by_name(alliance_id, name)

        if existing:
            # Update existing member
            return await self.update(existing.id, member_data)

        # Create new member
        member_data["alliance_id"] = str(alliance_id)
        member_data["name"] = name
        return await self.create(member_data)

    async def delete(self, member_id: UUID) -> bool:
        """
        Delete member (hard delete)

        Args:
            member_id: Member UUID

        Returns:
            True if deleted successfully

        符合 CLAUDE.md: Hard delete only
        """
        result = (
            self.client.from_(self.table_name).delete().eq("id", str(member_id)).execute()
        )

        self._handle_supabase_result(result, allow_empty=True)

        return True
