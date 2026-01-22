"""
Pytest Configuration and Shared Fixtures

Provides:
- Common test fixtures for mocking repositories and services
- Sample data factories for consistent test data
- Async test support configuration
"""

import sys
from datetime import datetime
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID, uuid4

import pytest

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


# =============================================================================
# UUID Fixtures
# =============================================================================


@pytest.fixture
def user_id() -> UUID:
    """Fixed user UUID for consistent testing"""
    return UUID("11111111-1111-1111-1111-111111111111")


@pytest.fixture
def alliance_id() -> UUID:
    """Fixed alliance UUID for consistent testing"""
    return UUID("22222222-2222-2222-2222-222222222222")


@pytest.fixture
def season_id() -> UUID:
    """Fixed season UUID for consistent testing"""
    return UUID("33333333-3333-3333-3333-333333333333")


@pytest.fixture
def member_id() -> UUID:
    """Fixed member UUID for consistent testing"""
    return UUID("44444444-4444-4444-4444-444444444444")


# =============================================================================
# CSV Test Data Fixtures
# =============================================================================


@pytest.fixture
def valid_csv_filename() -> str:
    """Valid CSV filename with correct format"""
    return "同盟統計2025年10月09日10时13分09秒.csv"


@pytest.fixture
def valid_csv_content() -> str:
    """Valid CSV content with all required fields"""
    return """成員, 貢獻排行, 貢獻本週, 戰功本週, 助攻本週, 捐獻本週, 貢獻總量, 戰功總量, 助攻總量, 捐獻總量, 勢力值, 所屬州, 分組
張飛, 1, 15000, 85000, 320, 5000, 150000, 850000, 3200, 50000, 125000, 徐州, 前鋒隊
關羽, 2, 12000, 72000, 280, 4500, 140000, 720000, 2800, 45000, 118000, 徐州, 前鋒隊
趙雲, 3, 10000, 65000, 250, 4000, 130000, 650000, 2500, 40000, 110000, 荊州, 後勤隊
劉備, 4, 8000, 45000, 180, 3500, 100000, 450000, 1800, 35000, 95000, 益州, 未分組"""


@pytest.fixture
def valid_csv_content_simplified() -> str:
    """Valid CSV content with simplified Chinese field names"""
    return """成员, 贡献排行, 贡献本周, 战功本周, 助攻本周, 捐献本周, 贡献总量, 战功总量, 助攻总量, 捐献总量, 势力值, 所属州, 分组
张飞, 1, 15000, 85000, 320, 5000, 150000, 850000, 3200, 50000, 125000, 徐州, 前锋队"""


@pytest.fixture
def csv_content_with_bom() -> str:
    """CSV content with UTF-8 BOM marker"""
    return """\ufeff成員, 貢獻排行, 貢獻本週, 戰功本週, 助攻本週, 捐獻本週, 貢獻總量, 戰功總量, 助攻總量, 捐獻總量, 勢力值, 所屬州, 分組
張飛, 1, 15000, 85000, 320, 5000, 150000, 850000, 3200, 50000, 125000, 徐州, 前鋒隊"""


# =============================================================================
# Mock Repository Fixtures
# =============================================================================


@pytest.fixture
def mock_collaborator_repo() -> MagicMock:
    """Mock AllianceCollaboratorRepository"""
    repo = MagicMock()
    repo.get_collaborator_role = AsyncMock(return_value="owner")
    return repo


@pytest.fixture
def mock_season_repo() -> MagicMock:
    """Mock SeasonRepository"""
    repo = MagicMock()
    repo.get_by_id = AsyncMock(return_value=None)
    repo.get_active_season = AsyncMock(return_value=None)
    repo.create = AsyncMock()
    repo.update = AsyncMock()
    return repo


# =============================================================================
# Sample Data Factories
# =============================================================================


def create_sample_member(
    name: str = "測試成員",
    group: str | None = "前鋒隊",
    rank: int = 1,
    weekly_contribution: int = 10000,
    weekly_merit: int = 50000,
    weekly_assist: int = 200,
    weekly_donation: int = 3000,
) -> dict[str, Any]:
    """Factory for creating sample member data"""
    return {
        "member_name": name,
        "contribution_rank": rank,
        "weekly_contribution": weekly_contribution,
        "weekly_merit": weekly_merit,
        "weekly_assist": weekly_assist,
        "weekly_donation": weekly_donation,
        "total_contribution": weekly_contribution * 10,
        "total_merit": weekly_merit * 10,
        "total_assist": weekly_assist * 10,
        "total_donation": weekly_donation * 10,
        "power_value": 100000,
        "state": "徐州",
        "group_name": group,
    }


def create_sample_season(
    season_id: UUID | None = None,
    alliance_id: UUID | None = None,
    name: str = "S1",
    is_active: bool = True,
) -> dict[str, Any]:
    """Factory for creating sample season data"""
    return {
        "id": season_id or uuid4(),
        "alliance_id": alliance_id or uuid4(),
        "name": name,
        "is_active": is_active,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
