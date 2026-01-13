/**
 * EventCard - Collapsible Event Card with Inline Stats
 *
 * Single-row event display with expandable quick preview.
 * Follows the same pattern as SeasonCard for UI consistency.
 *
 * Design rationale:
 * - Collapsed: Show key metrics for quick scanning (duration, participation, absent count)
 * - Expanded: 3 KPI cards + stats row with MVP + compact box plot for merit distribution
 */

import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CollapsibleCard } from '@/components/ui/collapsible-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MiniMetricCard } from '@/components/ui/MiniMetricCard.tsx'
import { ChevronRight, CheckCircle, XCircle, UserPlus, Users, Swords, Clock, Trophy } from 'lucide-react'
import { formatNumberCompact, formatNumber, calculateBoxPlotStats } from '@/lib/chart-utils'
import { BoxPlot } from '@/components/analytics/BoxPlot'
import {
  getEventIcon,
  formatEventTime,
  getEventTypeBadgeVariant,
  getEventTypeLabel,
  formatDuration,
  formatTimeRange,
} from '@/lib/event-utils'
import type { EventListItem, EventSummary, EventMemberMetric } from '@/types/event'
import type { DistributionBin } from '@/types/analytics'

// ============================================================================
// Types
// ============================================================================

interface EventCardProps {
  readonly event: EventListItem
  readonly eventDetail?: {
    summary: EventSummary
    metrics: readonly EventMemberMetric[]
    merit_distribution: readonly DistributionBin[]
  } | null
}

// ============================================================================
// Inline Stats (for collapsed state)
// ============================================================================

interface InlineStatsProps {
  readonly event: EventListItem
}

function InlineStats({ event }: InlineStatsProps) {
  const duration = formatDuration(event.event_start, event.event_end)
  const timeDisplay = formatEventTime(event.event_start, event.event_end)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      {/* Time range */}
      <span>{timeDisplay}</span>

      {/* Duration */}
      {duration && (
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {duration}
        </span>
      )}

      {/* Participation rate */}
      {event.participation_rate != null && (
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {event.participation_rate}%
        </span>
      )}

      {/* Total merit */}
      {event.total_merit != null && (
        <span className="flex items-center gap-1">
          <Swords className="h-3.5 w-3.5" />
          {formatNumberCompact(event.total_merit)}
        </span>
      )}

      {/* Absent count - highlighted if > 0 */}
      {event.absent_count != null && event.absent_count > 0 && (
        <span className="flex items-center gap-1 text-destructive font-medium">
          <XCircle className="h-3.5 w-3.5" />
          {event.absent_count} 人缺席
        </span>
      )}
    </div>
  )
}

// ============================================================================
// Expanded Content
// ============================================================================

interface ExpandedContentProps {
  readonly event: EventListItem
  readonly eventDetail: {
    summary: EventSummary
    metrics: readonly EventMemberMetric[]
  }
}

function ExpandedContent({ event, eventDetail }: ExpandedContentProps) {
  const navigate = useNavigate()
  const { summary, metrics } = eventDetail
  const duration = formatDuration(event.event_start, event.event_end)
  const timeRange = formatTimeRange(event.event_start, event.event_end)

  // Calculate box plot stats from participated members' merit_diff
  const meritStats = useMemo(() => {
    const participatedValues = metrics
      .filter((m) => m.merit_diff > 0)
      .map((m) => m.merit_diff)
    return calculateBoxPlotStats(participatedValues)
  }, [metrics])

  return (
    <div className="space-y-4">
      {/* KPI Grid - 3 cards: Participation, Total Merit, Duration */}
      <div className="grid gap-3 grid-cols-3">
        <MiniMetricCard
          title="參與率"
          value={`${summary.participation_rate}%`}
          subtitle={`${summary.participated_count}/${summary.total_members - summary.new_member_count} 人`}
          icon={<Users className="h-4 w-4" />}
        />
        <MiniMetricCard
          title="總戰功"
          value={formatNumberCompact(summary.total_merit)}
          icon={<Swords className="h-4 w-4" />}
        />
        <MiniMetricCard
          title="持續時間"
          value={duration ?? '-'}
          subtitle={timeRange ?? undefined}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      {/* Stats Row: Participation + Absent + New Members + MVP */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="h-4 w-4 text-primary" />
          <span>參與 {summary.participated_count} 人</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="h-4 w-4 text-destructive" />
          <span>缺席 {summary.absent_count} 人</span>
        </div>
        {summary.new_member_count > 0 && (
          <div className="flex items-center gap-1.5">
            <UserPlus className="h-4 w-4 text-yellow-500" />
            <span>新成員 {summary.new_member_count} 人</span>
          </div>
        )}
        {/* MVP inline instead of separate card */}
        {summary.mvp_member_name && (
          <div className="flex items-center gap-1.5 ml-auto">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">{summary.mvp_member_name}</span>
            {summary.mvp_merit != null && (
              <span className="text-muted-foreground">({formatNumber(summary.mvp_merit)})</span>
            )}
          </div>
        )}
      </div>

      {/* Compact Box Plot for merit distribution */}
      {meritStats && (
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-2">戰功分佈</p>
          <BoxPlot stats={meritStats} showLabels={true} />
        </div>
      )}

      {/* View Detail Button */}
      <div className="flex justify-end pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/events/${event.id}`)
          }}
        >
          查看完整分析
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function EventCard({ event, eventDetail }: EventCardProps) {
  const navigate = useNavigate()
  const Icon = getEventIcon()
  const eventTypeLabel = getEventTypeLabel(event.event_type)

  const handleViewDetail = useCallback(() => {
    navigate(`/events/${event.id}`)
  }, [event.id, navigate])

  const icon = <Icon className="h-4 w-4" />

  // Only show badge if event_type exists
  const badge = eventTypeLabel ? (
    <Badge variant={getEventTypeBadgeVariant()} className="text-xs">
      {eventTypeLabel}
    </Badge>
  ) : null

  const actions = (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2"
      onClick={(e) => {
        e.stopPropagation()
        handleViewDetail()
      }}
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  )

  // Use InlineStats component for collapsed description
  const description = <InlineStats event={event} />

  return (
    <CollapsibleCard
      icon={icon}
      title={event.name}
      badge={badge}
      description={description}
      actions={actions}
      collapsible={true}
      defaultExpanded={false}
    >
      {eventDetail ? (
        <ExpandedContent
          event={event}
          eventDetail={{
            summary: eventDetail.summary,
            metrics: eventDetail.metrics,
          }}
        />
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          <p className="text-sm">載入中...</p>
        </div>
      )}
    </CollapsibleCard>
  )
}
