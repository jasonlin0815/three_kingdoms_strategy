"""
Contribution Repository

符合 CLAUDE.md 🔴:
- Inherits from SupabaseRepository
- Uses _handle_supabase_result() for all queries
"""

from uuid import UUID

from src.models.contribution import Contribution, ContributionCreate
from src.repositories.base import SupabaseRepository


class ContributionRepository(SupabaseRepository[Contribution]):
    """Repository for contribution event data access"""

    def __init__(self):
        """Initialize contribution repository"""
        super().__init__(table_name="donation_events", model_class=Contribution)

    async def get_by_season(self, season_id: UUID) -> list[Contribution]:
        """
        Get all contribution events for a season

        Args:
            season_id: Season UUID

        Returns:
            List of contribution event instances

        符合 CLAUDE.md 🔴: Uses _handle_supabase_result()
        """
        result = await self._execute_async(
            lambda: self.client.from_(self.table_name)
            .select("*")
            .eq("season_id", str(season_id))
            .order("created_at", desc=True)
            .execute()
        )

        data = self._handle_supabase_result(result, allow_empty=True)
        return self._build_models(data)

    async def get_by_alliance_and_season(
        self, alliance_id: UUID, season_id: UUID
    ) -> list[Contribution]:
        """
        Get all contribution events for an alliance in a season

        Args:
            alliance_id: Alliance UUID
            season_id: Season UUID

        Returns:
            List of contribution event instances

        符合 CLAUDE.md 🔴: Uses _handle_supabase_result()
        """
        result = await self._execute_async(
            lambda: self.client.from_(self.table_name)
            .select("*")
            .eq("alliance_id", str(alliance_id))
            .eq("season_id", str(season_id))
            .order("created_at", desc=True)
            .execute()
        )

        data = self._handle_supabase_result(result, allow_empty=True)
        return self._build_models(data)

    async def create(self, contribution_data: ContributionCreate) -> Contribution:
        """
        Create new contribution event

        Args:
            contribution_data: Contribution creation data

        Returns:
            Created contribution instance

        符合 CLAUDE.md 🔴: Uses _handle_supabase_result()
        """
        insert_data = contribution_data.model_dump(mode="json")
        result = await self._execute_async(
            lambda: self.client.from_(self.table_name).insert(insert_data).execute()
        )
        data = self._handle_supabase_result(result, expect_single=True)
        return self._build_model(data)

    async def delete(self, contribution_id: UUID) -> None:
        """Delete a contribution event by ID"""
        await self._execute_async(
            lambda: self.client
            .from_(self.table_name)
            .delete()
            .eq("id", str(contribution_id))
            .execute()
        )
