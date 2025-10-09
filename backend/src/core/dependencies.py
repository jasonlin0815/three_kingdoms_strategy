"""
FastAPI dependency injection providers

符合 CLAUDE.md: Provider Pattern with Depends()
"""


from supabase import Client

from src.core.database import get_supabase_client
from src.services.alliance_service import AllianceService
from src.services.csv_upload_service import CSVUploadService
from src.services.season_service import SeasonService


def get_db() -> Client:
    """
    Get Supabase database client

    Returns:
        Supabase client instance

    Usage:
        @app.get("/endpoint")
        async def endpoint(db: Annotated[Client, Depends(get_db)]):
            pass
    """
    return get_supabase_client()


def get_alliance_service() -> AllianceService:
    """
    Get alliance service instance

    Returns:
        AllianceService instance

    Usage:
        @app.get("/alliances")
        async def get_alliance(service: Annotated[AllianceService, Depends(get_alliance_service)]):
            pass

    符合 CLAUDE.md 🔴: Provider Pattern for service injection
    """
    return AllianceService()


def get_csv_upload_service() -> CSVUploadService:
    """
    Get CSV upload service instance

    Returns:
        CSVUploadService instance

    Usage:
        @app.post("/uploads")
        async def upload(service: Annotated[CSVUploadService, Depends(get_csv_upload_service)]):
            pass

    符合 CLAUDE.md 🔴: Provider Pattern for service injection
    """
    return CSVUploadService()


def get_season_service() -> SeasonService:
    """
    Get season service instance

    Returns:
        SeasonService instance

    Usage:
        @app.get("/seasons")
        async def get_seasons(service: Annotated[SeasonService, Depends(get_season_service)]):
            pass

    符合 CLAUDE.md 🔴: Provider Pattern for service injection
    """
    return SeasonService()
