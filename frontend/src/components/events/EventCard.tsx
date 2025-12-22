/**
 * EventCard - Collapsible Event Card with Inline Stats
 *
 * Single-row event display with expandable quick preview.
 * Follows the same pattern as SeasonCard for UI consistency.
 */

import { useCallback } from 'react'
import { CollapsibleCard } from '@/components/ui/collapsible-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronRight, CheckCircle, XCircle, UserPlus } from 'lucide-react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartConfig, ChartTooltip } from '@/components/ui/chart'
import { formatNumber, formatNumberCompact } from '@/lib/chart-utils'
import {
  getEventIcon,
  formatEventTime,
  getEventTypeBadgeVariant,
  EVENT_TYPE_CONFIG,
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
  readonly onViewDetail: (eventId: string) => void
}

// ============================================================================
// Chart Config
// ============================================================================

const distributionConfig = {
  count: { label: '人數', color: 'var(--primary)' },
} satisfies ChartConfig

// ============================================================================
// KPI Mini Card
// ============================================================================

interface KpiMiniCardProps {
  readonly title: string
  readonly value: string | number
  readonly subtitle?: string
}

function KpiMiniCard({ title, value, subtitle }: KpiMiniCardProps) {
  return (
    <Card>
      <CardContent className="py-3 px-4">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-lg font-bold tabular-nums mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Expanded Content
// ============================================================================

interface ExpandedContentProps {
  readonly eventId: string
  readonly eventDetail: {
    summary: EventSummary
    merit_distribution: readonly DistributionBin[]
  }
  readonly onViewDetail: (eventId: string) => void
}

function ExpandedContent({ eventId, eventDetail, onViewDetail }: ExpandedContentProps) {
  const { summary, merit_distribution } = eventDetail

  return (
    <div className="space-y-4">
      {/* KPI Grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <KpiMiniCard
          title="參與率"
          value={`${summary.participation_rate}%`}
          subtitle={`${summary.participated_count}/${summary.total_members - summary.new_member_count} 人`}
        />
        <KpiMiniCard
          title="總戰功"
          value={formatNumberCompact(summary.total_merit)}
        />
        <KpiMiniCard
          title="MVP"
          value={summary.mvp_member_name ?? '-'}
          subtitle={summary.mvp_merit != null ? `${formatNumber(summary.mvp_merit)} 戰功` : undefined}
        />
        <KpiMiniCard
          title="平均戰功"
          value={formatNumber(summary.avg_merit)}
          subtitle={`${summary.participated_count} 位參與`}
        />
      </div>

      {/* Participation Stats */}
      <div className="flex items-center gap-4 text-sm">
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
      </div>

      {/* Merit Distribution Chart */}
      {merit_distribution.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">戰功分佈</p>
          <ChartContainer config={distributionConfig} className="h-[120px] w-full">
            <BarChart data={[...merit_distribution]} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="range" tickLine={false} axisLine={false} className="text-xs" tick={{ fontSize: 10 }} />
              <YAxis tickLine={false} axisLine={false} className="text-xs" width={25} tick={{ fontSize: 10 }} />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as DistributionBin
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="font-medium text-sm">戰功 {d.range}</div>
                      <div className="text-xs">{d.count} 人</div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      )}

      {/* View Detail Button */}
      <div className="flex justify-end pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onViewDetail(eventId)
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

export function EventCard({ event, eventDetail, onViewDetail }: EventCardProps) {
  const Icon = getEventIcon(event.event_type)
  const config = EVENT_TYPE_CONFIG[event.event_type]

  const handleViewDetail = useCallback(() => {
    onViewDetail(event.id)
  }, [event.id, onViewDetail])

  // Build inline description with key metrics
  const inlineStats = [
    formatEventTime(event.event_start, event.event_end),
    event.participation_rate != null ? `參與 ${event.participation_rate}%` : null,
    event.total_merit != null ? `戰功 ${formatNumberCompact(event.total_merit)}` : null,
    event.mvp_name ? `MVP ${event.mvp_name}` : null,
  ].filter(Boolean).join(' · ')

  const icon = <Icon className="h-4 w-4" />

  const badge = (
    <Badge variant={getEventTypeBadgeVariant(event.event_type)} className="text-xs">
      {config.label}
    </Badge>
  )

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

  return (
    <CollapsibleCard
      icon={icon}
      title={event.name}
      badge={badge}
      description={inlineStats}
      actions={actions}
      collapsible={true}
      defaultExpanded={false}
    >
      {eventDetail ? (
        <ExpandedContent
          eventId={event.id}
          eventDetail={{
            summary: eventDetail.summary,
            merit_distribution: eventDetail.merit_distribution,
          }}
          onViewDetail={onViewDetail}
        />
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          <p className="text-sm">載入中...</p>
        </div>
      )}
    </CollapsibleCard>
  )
}
