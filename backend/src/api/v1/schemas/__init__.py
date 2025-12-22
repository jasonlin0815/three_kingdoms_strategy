"""API v1 schemas (request/response models)"""

from src.api.v1.schemas.analytics import (
    AllianceAveragesResponse,
    AllianceMetricsAverage,
    AllianceTrendItem,
    MemberComparisonResponse,
    MemberListItem,
    MemberMetricsSnapshot,
    MemberTrendItem,
    SeasonSummaryResponse,
)
from src.api.v1.schemas.events import (
    CreateEventRequest,
    DistributionBinResponse,
    EventAnalyticsResponse,
    EventDetailResponse,
    EventListItemResponse,
    EventMemberMetricResponse,
    EventSummaryResponse,
    ProcessEventRequest,
)

__all__ = [
    # Analytics schemas
    "AllianceAveragesResponse",
    "AllianceMetricsAverage",
    "AllianceTrendItem",
    "MemberComparisonResponse",
    "MemberListItem",
    "MemberMetricsSnapshot",
    "MemberTrendItem",
    "SeasonSummaryResponse",
    # Event schemas
    "CreateEventRequest",
    "DistributionBinResponse",
    "EventAnalyticsResponse",
    "EventDetailResponse",
    "EventListItemResponse",
    "EventMemberMetricResponse",
    "EventSummaryResponse",
    "ProcessEventRequest",
]
