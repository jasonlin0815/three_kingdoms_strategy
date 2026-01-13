"""
Contribution Service

管理捐獻事件與成員貢獻計算

核心功能:
1. 建立/查詢捐獻事件
2. 從快照計算成員貢獻差異（creation_time 到 deadline 之間的 total_contribution 差值）
3. 支援同盟與懲罰兩種類型

符合 CLAUDE.md 🔴:
- Service layer orchestrates repositories
- NO direct database calls
"""

from uuid import UUID

from src.models.contribution import (
    Contribution,
    ContributionCreate,
    ContributionInfo,
    ContributionWithInfo,
)
from src.repositories.contribution_repository import ContributionRepository
from src.repositories.csv_upload_repository import CsvUploadRepository
from src.repositories.member_snapshot_repository import MemberSnapshotRepository
from src.services.permission_service import PermissionService


class ContributionService:
    """Service for contribution event management"""

    def __init__(self):
        """Initialize contribution service"""
        self._contribution_repo = ContributionRepository()
        self._upload_repo = CsvUploadRepository()
        self._snapshot_repo = MemberSnapshotRepository()
        self._permission_service = PermissionService()

    async def verify_user_access(self, user_id: UUID, contribution_id: UUID) -> UUID:
        """
        Verify user has access to contribution's alliance

        Args:
            user_id: User UUID
            contribution_id: Contribution UUID

        Returns:
            Alliance UUID if user has access

        Raises:
            HTTPException: If user lacks access
        """
        contribution = await self._contribution_repo.get_by_id(contribution_id)
        return await self._permission_service.verify_alliance_access(
            user_id, contribution.alliance_id
        )

    async def get_contributions_by_alliance_and_season(
        self, alliance_id: UUID, season_id: UUID
    ) -> list[Contribution]:
        """
        Get all contribution events for an alliance in a season

        Args:
            alliance_id: Alliance UUID
            season_id: Season UUID

        Returns:
            List of contribution events
        """
        return await self._contribution_repo.get_by_alliance_and_season(
            alliance_id, season_id
        )

    async def create_contribution(
        self, contribution_data: ContributionCreate
    ) -> Contribution:
        """
        Create new contribution event

        Args:
            contribution_data: Contribution creation data

        Returns:
            Created contribution event
        """
        return await self._contribution_repo.create(contribution_data)

    async def get_contribution_with_info(
        self, contribution_id: UUID, target_contribution: int | None = None
    ) -> ContributionWithInfo:
        """
        Get contribution event with member contribution info.

        Calculates contribution_made as the difference in total_contribution
        between snapshots at creation_time and deadline.

        Args:
            contribution_id: Contribution UUID
            target_contribution: Override target for all members (defaults to stored value)

        Returns:
            Contribution with member contribution details
        """
        contribution = await self._contribution_repo.get_by_id(contribution_id)
        effective_target = (
            target_contribution
            if target_contribution is not None
            else contribution.target_contribution
        )

        # Find snapshots closest to creation_time and deadline
        start_upload = await self._upload_repo.get_closest_before_date(
            season_id=contribution.season_id, target_date=contribution.created_at
        )

        end_upload = await self._upload_repo.get_closest_before_date(
            season_id=contribution.season_id, target_date=contribution.deadline
        )

        if not start_upload or not end_upload:
            # No snapshots found, return empty info
            return ContributionWithInfo(
                **contribution.model_dump(), contribution_info=[]
            )

        # Get member snapshots from both uploads
        start_snapshots = await self._snapshot_repo.get_by_upload(start_upload.id)
        end_snapshots = await self._snapshot_repo.get_by_upload(end_upload.id)

        # Build lookup dictionaries
        start_snapshot_map = {snap.member_id: snap for snap in start_snapshots}
        end_snapshot_map = {snap.member_id: snap for snap in end_snapshots}

        # Calculate contributions for all members in end snapshot
        contribution_info_list: list[ContributionInfo] = []

        for member_id, end_snap in end_snapshot_map.items():
            start_snap = start_snapshot_map.get(member_id)

            # Calculate contribution made (diff in total_contribution)
            start_total = start_snap.total_contribution if start_snap else 0
            end_total = end_snap.total_contribution
            contribution_made = max(0, end_total - start_total)

            contribution_info = ContributionInfo(
                member_id=member_id,
                member_name=end_snap.member_name,
                contribution_target=effective_target,
                contribution_made=contribution_made,
            )
            contribution_info_list.append(contribution_info)

        # Sort by contribution_made descending
        contribution_info_list.sort(
            key=lambda x: x.contribution_made, reverse=True
        )

        return ContributionWithInfo(
            **contribution.model_dump(), contribution_info=contribution_info_list
        )
