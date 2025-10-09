"""
Alliance Service Layer

符合 CLAUDE.md 🔴:
- Business logic layer
- Orchestrates repositories
- No direct database calls
"""

from uuid import UUID

from src.models.alliance import Alliance, AllianceCreate, AllianceUpdate
from src.repositories.alliance_repository import AllianceRepository


class AllianceService:
    """
    Alliance business logic service

    Handles alliance CRUD operations and validation
    """

    def __init__(self):
        """Initialize alliance service with repository"""
        self._repo = AllianceRepository()

    async def get_user_alliance(self, user_id: UUID) -> Alliance | None:
        """
        Get user's alliance

        Args:
            user_id: User UUID from authentication

        Returns:
            Alliance instance or None if not found
        """
        return await self._repo.get_by_user_id(user_id)

    async def create_alliance(self, user_id: UUID, alliance_data: AllianceCreate) -> Alliance:
        """
        Create new alliance for user

        Args:
            user_id: User UUID from authentication
            alliance_data: Alliance creation data

        Returns:
            Created alliance instance

        Raises:
            ValueError: If user already has an alliance
        """
        # Check if user already has an alliance
        existing = await self._repo.get_by_user_id(user_id)
        if existing:
            raise ValueError("User already has an alliance")

        # Create alliance
        data = alliance_data.model_dump()
        data["user_id"] = str(user_id)

        return await self._repo.create(data)

    async def update_alliance(
        self, user_id: UUID, alliance_data: AllianceUpdate
    ) -> Alliance:
        """
        Update user's alliance

        Args:
            user_id: User UUID from authentication
            alliance_data: Alliance update data

        Returns:
            Updated alliance instance

        Raises:
            ValueError: If user has no alliance
        """
        # Get user's alliance
        alliance = await self._repo.get_by_user_id(user_id)
        if not alliance:
            raise ValueError("User has no alliance to update")

        # Update only provided fields
        update_data = alliance_data.model_dump(exclude_unset=True)

        return await self._repo.update(alliance.id, update_data)

    async def delete_alliance(self, user_id: UUID) -> bool:
        """
        Delete user's alliance

        Args:
            user_id: User UUID from authentication

        Returns:
            True if deleted successfully

        Raises:
            ValueError: If user has no alliance
        """
        # Get user's alliance
        alliance = await self._repo.get_by_user_id(user_id)
        if not alliance:
            raise ValueError("User has no alliance to delete")

        return await self._repo.delete(alliance.id)
