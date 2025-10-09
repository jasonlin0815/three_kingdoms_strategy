"""
CSV Upload API Endpoints

符合 CLAUDE.md 🔴:
- API Layer delegates to Service Layer
- Uses Provider Pattern for dependency injection
- Returns proper HTTP status codes
- JWT authentication required
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from src.core.auth import get_current_user_id
from src.core.dependencies import get_csv_upload_service
from src.services.csv_upload_service import CSVUploadService

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("")
async def upload_csv(
    season_id: Annotated[UUID, Form()],
    file: Annotated[UploadFile, File()],
    service: Annotated[CSVUploadService, Depends(get_csv_upload_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
):
    """
    Upload CSV file for a season

    Args:
        season_id: Season UUID
        file: CSV file upload
        service: CSV upload service (injected)
        user_id: User UUID (from JWT token)

    Returns:
        Upload result with statistics

    符合 CLAUDE.md 🔴: API layer delegates to service
    """
    # Validate file type
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV file")

    # Read file content
    try:
        content = await file.read()
        csv_content = content.decode("utf-8")
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to read CSV file: {str(e)}"
        ) from e

    # Upload CSV
    result = await service.upload_csv(
        user_id=user_id,
        season_id=season_id,
        filename=file.filename,
        csv_content=csv_content,
    )

    return result


@router.get("")
async def list_uploads(
    season_id: UUID,
    service: Annotated[CSVUploadService, Depends(get_csv_upload_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
):
    """
    Get all CSV uploads for a season

    Args:
        season_id: Season UUID
        service: CSV upload service (injected)
        user_id: User UUID (from JWT token)

    Returns:
        List of upload records

    符合 CLAUDE.md 🔴: API layer delegates to service
    """
    uploads = await service.get_uploads_by_season(user_id=user_id, season_id=season_id)

    return {"uploads": uploads, "total": len(uploads)}


@router.delete("/{upload_id}")
async def delete_upload(
    upload_id: UUID,
    service: Annotated[CSVUploadService, Depends(get_csv_upload_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
):
    """
    Delete a CSV upload (with cascading snapshots)

    Args:
        upload_id: CSV upload UUID
        service: CSV upload service (injected)
        user_id: User UUID (from JWT token)

    Returns:
        Success message

    符合 CLAUDE.md 🔴: API layer delegates to service
    """
    success = await service.delete_upload(user_id=user_id, upload_id=upload_id)

    if success:
        return {"message": "Upload deleted successfully", "upload_id": upload_id}

    raise HTTPException(status_code=500, detail="Failed to delete upload")
