"""
Copper Mine Service

Business logic for copper mine management:
- Register copper mines from LIFF (with auto season/member matching)
- List and manage mines per alliance
- Dashboard ownership management

符合 CLAUDE.md 🔴:
- Business logic in Service layer
- No direct database calls (uses Repository)
- Exception handling with proper chaining
"""

from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status

from src.models.copper_mine import (
    AllowedLevel,
    CopperMine,
    CopperMineListResponse,
    CopperMineOwnershipResponse,
    CopperMineResponse,
    RegisterCopperResponse,
)
from src.repositories.copper_mine_repository import CopperMineRepository
from src.repositories.copper_mine_rule_repository import CopperMineRuleRepository
from src.repositories.line_binding_repository import LineBindingRepository
from src.repositories.member_repository import MemberRepository
from src.repositories.member_snapshot_repository import MemberSnapshotRepository
from src.repositories.season_repository import SeasonRepository


class CopperMineService:
    """Service for copper mine operations (LIFF + Dashboard)"""

    def __init__(
        self,
        repository: CopperMineRepository | None = None,
        line_binding_repository: LineBindingRepository | None = None,
        season_repository: SeasonRepository | None = None,
        member_repository: MemberRepository | None = None,
        rule_repository: CopperMineRuleRepository | None = None,
        snapshot_repository: MemberSnapshotRepository | None = None,
    ):
        self.repository = repository or CopperMineRepository()
        self.line_binding_repository = (
            line_binding_repository or LineBindingRepository()
        )
        self.season_repository = season_repository or SeasonRepository()
        self.member_repository = member_repository or MemberRepository()
        self.rule_repository = rule_repository or CopperMineRuleRepository()
        self.snapshot_repository = snapshot_repository or MemberSnapshotRepository()

    async def _get_alliance_id_from_group(self, line_group_id: str) -> UUID:
        """
        Get alliance ID from LINE group ID

        Raises:
            HTTPException 404: If group not bound to any alliance
        """
        group_binding = await self.line_binding_repository.get_group_binding_by_line_group_id(
            line_group_id
        )
        if not group_binding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not bound to any alliance"
            )
        return group_binding.alliance_id

    def _to_response(self, mine: CopperMine) -> CopperMineResponse:
        """Convert CopperMine entity to response model"""
        return CopperMineResponse(
            id=str(mine.id),
            game_id=mine.game_id,
            coord_x=mine.coord_x,
            coord_y=mine.coord_y,
            level=mine.level,
            status=mine.status,
            notes=mine.notes,
            registered_at=mine.registered_at
        )

    async def get_mines_list(
        self,
        line_group_id: str,
        line_user_id: str
    ) -> CopperMineListResponse:
        """
        Get copper mines list for LIFF display

        Args:
            line_group_id: LINE group ID
            line_user_id: LINE user ID (for potential filtering)

        Returns:
            CopperMineListResponse with mines and total count
        """
        alliance_id = await self._get_alliance_id_from_group(line_group_id)

        mines = await self.repository.get_mines_by_alliance(alliance_id)

        return CopperMineListResponse(
            mines=[self._to_response(mine) for mine in mines],
            total=len(mines)
        )

    async def _get_active_season(self, alliance_id: UUID) -> UUID | None:
        """Get active season ID for an alliance"""
        season = await self.season_repository.get_active_season(alliance_id)
        return season.id if season else None

    async def _match_member_id(self, alliance_id: UUID, game_id: str) -> UUID | None:
        """Try to match game_id to a member"""
        member = await self.member_repository.get_member_by_name(alliance_id, game_id)
        return member.id if member else None

    async def _check_coord_available(
        self,
        alliance_id: UUID,
        coord_x: int,
        coord_y: int,
        season_id: UUID | None = None
    ) -> None:
        """
        Check if coordinates are available for a new copper mine.

        P0 修復: 統一座標唯一性驗證邏輯
        - 當有 season_id 時，只檢查該賽季內是否重複
        - 當沒有 season_id 時，檢查整個同盟是否重複

        Args:
            alliance_id: Alliance UUID
            coord_x: X coordinate
            coord_y: Y coordinate
            season_id: Optional season UUID for scoped check

        Raises:
            HTTPException 409: If coordinates are already taken
        """
        existing = await self.repository.get_mine_by_coords(
            alliance_id=alliance_id,
            coord_x=coord_x,
            coord_y=coord_y,
            season_id=season_id
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"座標 ({coord_x}, {coord_y}) 已被註冊"
            )

    def _is_level_allowed(self, level: int, allowed_level: AllowedLevel) -> bool:
        """
        Check if the mine level is allowed by the rule.

        Args:
            level: Mine level (9 or 10)
            allowed_level: Rule's allowed level setting

        Returns:
            True if level is allowed
        """
        if allowed_level == "both":
            return True
        if allowed_level == "nine" and level == 9:
            return True
        if allowed_level == "ten" and level == 10:
            return True
        return False

    async def _validate_rule(
        self,
        alliance_id: UUID,
        member_id: UUID | None,
        season_id: UUID | None,
        level: int
    ) -> None:
        """
        Validate copper mine registration against alliance rules.

        P1 修復: LIFF 銅礦註冊加入規則驗證

        Rules validation:
        1. Check member's current mine count in the season
        2. Get rule for the next tier (count + 1)
        3. Validate member's total_merit >= rule.required_merit
        4. Validate level matches rule.allowed_level

        Args:
            alliance_id: Alliance UUID
            member_id: Member UUID (may be None if not matched)
            season_id: Season UUID (may be None if no active season)
            level: Mine level (1-10)

        Raises:
            HTTPException 400: If member not found in system
            HTTPException 403: If rule validation fails
        """
        # Skip validation if no member_id (can't verify merit without member)
        if not member_id:
            return

        # Skip validation if no season (no rules apply without season context)
        if not season_id:
            return

        # Get member's current mine count in this season
        current_count = await self.repository.count_member_mines(season_id, member_id)
        next_tier = current_count + 1

        # Get rule for the next tier
        rule = await self.rule_repository.get_rule_by_tier(alliance_id, next_tier)

        # If no rule exists for this tier, allow registration (no restriction)
        if not rule:
            return

        # Get member's latest snapshot to check total_merit
        snapshot = await self.snapshot_repository.get_latest_by_member_in_season(
            member_id, season_id
        )

        if not snapshot:
            # No snapshot means member hasn't been in any CSV upload for this season
            # Allow registration but warn (they may have 0 merit)
            return

        # Validate merit requirement
        if snapshot.total_merit < rule.required_merit:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"總戰功不足：需要 {rule.required_merit:,}，目前 {snapshot.total_merit:,}"
            )

        # Validate level restriction
        if not self._is_level_allowed(level, rule.allowed_level):
            level_text = {
                "nine": "9 級",
                "ten": "10 級",
                "both": "9 或 10 級"
            }
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"第 {next_tier} 座銅礦只能申請{level_text[rule.allowed_level]}"
            )

    async def register_mine(
        self,
        line_group_id: str,
        line_user_id: str,
        game_id: str,
        coord_x: int,
        coord_y: int,
        level: int,
        notes: str | None = None
    ) -> RegisterCopperResponse:
        """
        Register a new copper mine (LIFF)

        Auto-fills:
        - season_id: From alliance's active season
        - member_id: Matched from game_id → members.name

        Args:
            line_group_id: LINE group ID
            line_user_id: LINE user ID who is registering
            game_id: Game ID of the member
            coord_x: X coordinate
            coord_y: Y coordinate
            level: Mine level (1-10)
            notes: Optional notes

        Returns:
            RegisterCopperResponse with created mine

        Raises:
            HTTPException 404: If group not bound
            HTTPException 409: If mine already exists at coordinates
        """
        alliance_id = await self._get_alliance_id_from_group(line_group_id)

        # Auto-fill season_id and member_id first (needed for coord check)
        season_id = await self._get_active_season(alliance_id)
        member_id = await self._match_member_id(alliance_id, game_id)

        # P0 修復: 使用統一的座標檢查方法
        # 當有活躍賽季時，只檢查該賽季內的座標
        await self._check_coord_available(
            alliance_id=alliance_id,
            coord_x=coord_x,
            coord_y=coord_y,
            season_id=season_id
        )

        # P1 修復: 驗證銅礦申請規則
        await self._validate_rule(
            alliance_id=alliance_id,
            member_id=member_id,
            season_id=season_id,
            level=level
        )

        # Create the mine
        mine = await self.repository.create_mine(
            alliance_id=alliance_id,
            registered_by_line_user_id=line_user_id,
            game_id=game_id,
            coord_x=coord_x,
            coord_y=coord_y,
            level=level,
            notes=notes,
            season_id=season_id,
            member_id=member_id,
        )

        return RegisterCopperResponse(
            success=True,
            mine=self._to_response(mine),
            message="Copper mine registered successfully"
        )

    async def delete_mine(
        self,
        mine_id: UUID,
        line_group_id: str,
        line_user_id: str
    ) -> bool:
        """
        Delete a copper mine (LIFF)

        Args:
            mine_id: Mine UUID to delete
            line_group_id: LINE group ID (for authorization)
            line_user_id: LINE user ID (for authorization)

        Returns:
            True if deleted

        Raises:
            HTTPException 404: If group not bound or mine not found
        """
        # Validate group binding
        await self._get_alliance_id_from_group(line_group_id)

        deleted = await self.repository.delete_mine(mine_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Copper mine not found"
            )

        return True

    # =========================================================================
    # Dashboard Methods
    # =========================================================================

    async def get_ownerships_by_season(
        self,
        season_id: UUID,
        alliance_id: UUID
    ) -> list[CopperMineOwnershipResponse]:
        """
        Get copper mine ownerships for Dashboard display

        Joins member data for display purposes.
        """
        # Get raw ownership data
        ownerships = await self.repository.get_ownerships_by_season_simple(season_id)

        # Get member info for each ownership
        responses = []
        for ownership in ownerships:
            member_id = ownership.get("member_id")
            member_name = ownership.get("game_id", "Unknown")
            member_group = None
            line_display_name = None

            if member_id:
                member = await self.member_repository.get_by_id(UUID(member_id))
                if member:
                    member_name = member.name
                    # Get LINE display name using game_id (member name)
                    line_binding = await self.line_binding_repository.get_member_binding_by_game_id(
                        alliance_id,
                        member_name
                    )
                    if line_binding:
                        line_display_name = line_binding.line_display_name
                # Get latest snapshot for group info
                snapshot = await self._get_latest_snapshot(UUID(member_id), season_id)
                if snapshot:
                    member_group = snapshot.get("group_name")

            responses.append(CopperMineOwnershipResponse(
                id=str(ownership["id"]),
                season_id=str(ownership["season_id"]),
                member_id=str(member_id) if member_id else None,
                coord_x=ownership["coord_x"],
                coord_y=ownership["coord_y"],
                level=ownership["level"],
                applied_at=ownership["registered_at"],
                created_at=ownership["registered_at"],
                member_name=member_name,
                member_group=member_group,
                line_display_name=line_display_name,
            ))

        return responses

    async def _get_latest_snapshot(
        self,
        member_id: UUID,
        season_id: UUID
    ) -> dict | None:
        """
        Get latest snapshot for a member in a season.

        P1 修復: 實作快照查詢以取得 group_name

        Args:
            member_id: Member UUID
            season_id: Season UUID

        Returns:
            Dict with snapshot data including group_name, or None
        """
        snapshot = await self.snapshot_repository.get_latest_by_member_in_season(
            member_id, season_id
        )
        if not snapshot:
            return None

        return {
            "group_name": snapshot.group_name,
            "total_merit": snapshot.total_merit,
        }

    async def create_ownership(
        self,
        season_id: UUID,
        alliance_id: UUID,
        member_id: UUID,
        coord_x: int,
        coord_y: int,
        level: int,
        applied_at: datetime | None = None
    ) -> CopperMineOwnershipResponse:
        """
        Create a copper mine ownership (Dashboard)

        Args:
            season_id: Season UUID
            alliance_id: Alliance UUID
            member_id: Member UUID
            coord_x: X coordinate
            coord_y: Y coordinate
            level: Mine level (9 or 10)
            applied_at: Optional application date

        Raises:
            HTTPException 404: If member not found
            HTTPException 409: If coordinates already taken
        """
        # Validate member exists
        member = await self.member_repository.get_by_id(member_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )

        # P0 修復: 使用統一的座標檢查方法
        await self._check_coord_available(
            alliance_id=alliance_id,
            coord_x=coord_x,
            coord_y=coord_y,
            season_id=season_id
        )

        # Create ownership
        mine = await self.repository.create_ownership(
            season_id=season_id,
            alliance_id=alliance_id,
            member_id=member_id,
            game_id=member.name,
            coord_x=coord_x,
            coord_y=coord_y,
            level=level,
            applied_at=applied_at,
        )

        return CopperMineOwnershipResponse(
            id=str(mine.id),
            season_id=str(season_id),
            member_id=str(member_id),
            coord_x=mine.coord_x,
            coord_y=mine.coord_y,
            level=mine.level,
            applied_at=mine.registered_at,
            created_at=mine.registered_at,
            member_name=member.name,
            member_group=None,
            line_display_name=None,
        )

    async def delete_ownership(
        self,
        ownership_id: UUID,
        alliance_id: UUID
    ) -> bool:
        """
        Delete a copper mine ownership (Dashboard)

        Args:
            ownership_id: Ownership UUID to delete
            alliance_id: Alliance UUID (for authorization)

        Returns:
            True if deleted

        Raises:
            HTTPException 404: If ownership not found
        """
        # Verify ownership exists and belongs to alliance
        ownership = await self.repository.get_by_id(ownership_id)
        if not ownership:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ownership not found"
            )

        if ownership.alliance_id != alliance_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ownership does not belong to this alliance"
            )

        deleted = await self.repository.delete_mine(ownership_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Failed to delete ownership"
            )

        return True
