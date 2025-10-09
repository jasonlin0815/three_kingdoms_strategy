"""
Alliance Repository

符合 CLAUDE.md 🔴:
- Inherits from SupabaseRepository
- Uses _handle_supabase_result() for all queries
- NEVER accesses result.data directly
"""

from uuid import UUID

from src.models.alliance import Alliance
from src.repositories.base import SupabaseRepository


class AllianceRepository(SupabaseRepository[Alliance]):
    """Repository for alliance data access"""

    def __init__(self):
        """Initialize alliance repository"""
        super().__init__(table_name="alliances", model_class=Alliance)

    async def get_by_user_id(self, user_id: UUID) -> Alliance | None:
        """
        Get alliance by user ID

        Args:
            user_id: User UUID

        Returns:
            Alliance instance or None if not found

        符合 CLAUDE.md 🔴: Uses _handle_supabase_result()
        """
        result = (
            self.client.from_(self.table_name)
            .select("*")
            .eq("user_id", str(user_id))
            .execute()
        )

        data = self._handle_supabase_result(result, allow_empty=True, expect_single=True)

        if not data:
            return None

        return self._build_model(data)

    async def create(self, alliance_data: dict) -> Alliance:
        """
        Create new alliance

        Args:
            alliance_data: Alliance data dictionary

        Returns:
            Created alliance instance

        符合 CLAUDE.md 🔴: Uses _handle_supabase_result()
        """
        result = self.client.from_(self.table_name).insert(alliance_data).execute()

        data = self._handle_supabase_result(result, expect_single=True)

        return self._build_model(data)

    async def update(self, alliance_id: UUID, alliance_data: dict) -> Alliance:
        """
        Update alliance

        Args:
            alliance_id: Alliance UUID
            alliance_data: Alliance data dictionary

        Returns:
            Updated alliance instance

        符合 CLAUDE.md 🔴: Uses _handle_supabase_result()
        """
        result = (
            self.client.from_(self.table_name)
            .update(alliance_data)
            .eq("id", str(alliance_id))
            .execute()
        )

        data = self._handle_supabase_result(result, expect_single=True)

        return self._build_model(data)

    async def delete(self, alliance_id: UUID) -> bool:
        """
        Delete alliance (hard delete)

        Args:
            alliance_id: Alliance UUID

        Returns:
            True if deleted successfully

        符合 CLAUDE.md: Hard delete only
        """
        result = (
            self.client.from_(self.table_name)
            .delete()
            .eq("id", str(alliance_id))
            .execute()
        )

        # Delete operations may return empty data
        self._handle_supabase_result(result, allow_empty=True)

        return True
