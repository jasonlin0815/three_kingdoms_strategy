"""
Contribution Target Repository

Stores per-member target overrides for contribution events.

符合 CLAUDE.md 🔴:
- Inherits from SupabaseRepository
- Uses _handle_supabase_result() for all queries
"""

from uuid import UUID

from src.models.contribution import ContributionTarget
from src.repositories.base import SupabaseRepository


class ContributionTargetRepository(SupabaseRepository[ContributionTarget]):
    """Repository for contribution target overrides"""

    def __init__(self):
        """Initialize repository"""
        super().__init__(table_name="contribution_targets", model_class=ContributionTarget)

    async def upsert_target(
        self, contribution_id: UUID, member_id: UUID, target_contribution: int
    ) -> ContributionTarget:
        """Insert or update a member target override for a contribution"""
        payload = {
            "contribution_id": str(contribution_id),
            "member_id": str(member_id),
            "target_contribution": target_contribution,
        }
        result = await self._execute_async(
            lambda: self.client.from_(self.table_name)
            .upsert(payload, on_conflict="contribution_id,member_id")
            .execute()
        )
        data = self._handle_supabase_result(result, expect_single=True)
        return self._build_model(data)

    async def delete_target(self, contribution_id: UUID, member_id: UUID) -> None:
        """Delete a member's target override for a contribution"""
        await self._execute_async(
            lambda: self.client
            .from_(self.table_name)
            .delete()
            .eq("contribution_id", str(contribution_id))
            .eq("member_id", str(member_id))
            .execute()
        )

    async def get_by_contribution(self, contribution_id: UUID) -> list[ContributionTarget]:
        """Fetch all member target overrides for a contribution"""
        result = await self._execute_async(
            lambda: self.client
            .from_(self.table_name)
            .select("*")
            .eq("contribution_id", str(contribution_id))
            .execute()
        )
        data = self._handle_supabase_result(result, allow_empty=True)
        return self._build_models(data)
