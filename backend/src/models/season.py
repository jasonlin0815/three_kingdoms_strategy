"""
Season Pydantic models

符合 CLAUDE.md: snake_case naming, type hints, Google-style docstrings
"""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class SeasonBase(BaseModel):
    """Base season model with common fields"""

    name: str = Field(..., min_length=1, max_length=100, description="Season name")
    start_date: date = Field(..., description="Season start date")
    end_date: date | None = Field(None, description="Season end date (NULL = ongoing)")
    is_active: bool = Field(True, description="Whether season is active")
    description: str | None = Field(None, max_length=500, description="Season description")

    @field_validator("end_date")
    @classmethod
    def validate_date_range(cls, v: date | None, info) -> date | None:
        """Validate end_date is after start_date"""
        if v is not None and "start_date" in info.data:
            start_date = info.data["start_date"]
            if v < start_date:
                raise ValueError("end_date must be after start_date")
        return v


class SeasonCreate(SeasonBase):
    """Season creation model"""

    alliance_id: UUID = Field(..., description="Alliance ID")


class SeasonUpdate(BaseModel):
    """Season update model"""

    name: str | None = Field(None, min_length=1, max_length=100)
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool | None = None
    description: str | None = Field(None, max_length=500)


class Season(SeasonBase):
    """Season model with all fields"""

    id: UUID
    alliance_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
