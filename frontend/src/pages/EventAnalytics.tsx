/**
 * EventAnalytics - Battle Event Performance Analytics
 *
 * Track and analyze member performance during specific battles/events.
 * Uses single-row CollapsibleCard design consistent with Seasons page.
 *
 * Features:
 * - Event list with expandable quick preview
 * - Create new events with before/after snapshots
 * - Event detail sheet with full member rankings and participation analysis
 */

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { AllianceGuard } from '@/components/alliance/AllianceGuard'
import { useSeasons } from '@/hooks/use-seasons'
import { Plus, Swords } from 'lucide-react'
import type {
  BattleEvent,
  EventType,
  EventListItem,
  EventSummary,
  EventMemberMetric,
} from '@/types/event'
import { CreateEventDialog } from '@/components/events/CreateEventDialog'
import { EventDetailSheet } from '@/components/events/EventDetailSheet'
import { EventCard } from '@/components/events/EventCard'

// ============================================================================
// Mock Data (to be replaced with real API calls)
// ============================================================================

const MOCK_EVENTS: EventListItem[] = [
  {
    id: '1',
    name: '徐州爭奪戰',
    event_type: 'siege',
    status: 'completed',
    event_start: '2025-12-20T14:00:00',
    event_end: '2025-12-20T18:00:00',
    participation_rate: 85,
    total_merit: 1234567,
    mvp_name: '趙雲',
    created_at: '2025-12-20T12:00:00',
  },
  {
    id: '2',
    name: '洛陽攻城戰',
    event_type: 'siege',
    status: 'completed',
    event_start: '2025-12-18T20:00:00',
    event_end: '2025-12-18T23:30:00',
    participation_rate: 92,
    total_merit: 987654,
    mvp_name: '關羽',
    created_at: '2025-12-18T18:00:00',
  },
  {
    id: '3',
    name: '世界BOSS討伐',
    event_type: 'boss',
    status: 'completed',
    event_start: '2025-12-15T21:00:00',
    event_end: '2025-12-15T21:30:00',
    participation_rate: 78,
    total_merit: 456789,
    mvp_name: '張飛',
    created_at: '2025-12-15T20:00:00',
  },
  {
    id: '4',
    name: '益州防守戰',
    event_type: 'defense',
    status: 'completed',
    event_start: '2025-12-12T19:00:00',
    event_end: '2025-12-12T22:00:00',
    participation_rate: 88,
    total_merit: 765432,
    mvp_name: '諸葛亮',
    created_at: '2025-12-12T18:00:00',
  },
]

const MOCK_EVENT_DETAIL = {
  event: {
    id: '1',
    alliance_id: 'alliance-1',
    season_id: 'season-1',
    name: '徐州爭奪戰',
    event_type: 'siege' as EventType,
    description: '與 XXX 盟爭奪徐州城控制權',
    before_upload_id: 'upload-1',
    after_upload_id: 'upload-2',
    event_start: '2025-12-20T14:00:00',
    event_end: '2025-12-20T18:00:00',
    status: 'completed' as const,
    created_at: '2025-12-20T12:00:00',
  } satisfies BattleEvent,
  summary: {
    total_members: 168,
    participated_count: 140,
    absent_count: 25,
    new_member_count: 3,
    participation_rate: 85,
    total_merit: 1234567,
    total_assist: 45678,
    total_contribution: 2345678,
    avg_merit: 8818,
    avg_assist: 326,
    mvp_member_id: 'member-1',
    mvp_member_name: '趙雲',
    mvp_merit: 15234,
  } satisfies EventSummary,
  metrics: [
    { id: '1', member_id: 'm1', member_name: '趙雲', group: '一組', contribution_diff: 25000, merit_diff: 15234, assist_diff: 523, donation_diff: 1000, power_diff: 500, participated: true, is_new_member: false, is_absent: false },
    { id: '2', member_id: 'm2', member_name: '關羽', group: '一組', contribution_diff: 22000, merit_diff: 14567, assist_diff: 489, donation_diff: 800, power_diff: 450, participated: true, is_new_member: false, is_absent: false },
    { id: '3', member_id: 'm3', member_name: '張飛', group: '一組', contribution_diff: 20000, merit_diff: 13890, assist_diff: 456, donation_diff: 900, power_diff: 400, participated: true, is_new_member: false, is_absent: false },
    { id: '4', member_id: 'm4', member_name: '諸葛亮', group: '二組', contribution_diff: 18000, merit_diff: 12345, assist_diff: 678, donation_diff: 1200, power_diff: 350, participated: true, is_new_member: false, is_absent: false },
    { id: '5', member_id: 'm5', member_name: '黃忠', group: '二組', contribution_diff: 16000, merit_diff: 11234, assist_diff: 345, donation_diff: 700, power_diff: 300, participated: true, is_new_member: false, is_absent: false },
    { id: '6', member_id: 'm6', member_name: '馬超', group: '二組', contribution_diff: 15000, merit_diff: 10567, assist_diff: 234, donation_diff: 600, power_diff: 280, participated: true, is_new_member: false, is_absent: false },
    { id: '7', member_id: 'm7', member_name: '魏延', group: '三組', contribution_diff: 14000, merit_diff: 9876, assist_diff: 345, donation_diff: 500, power_diff: 260, participated: true, is_new_member: false, is_absent: false },
    { id: '8', member_id: 'm8', member_name: '姜維', group: '三組', contribution_diff: 12000, merit_diff: 8765, assist_diff: 234, donation_diff: 400, power_diff: 240, participated: true, is_new_member: false, is_absent: false },
    { id: '9', member_id: 'm9', member_name: '新成員A', group: null, contribution_diff: 5000, merit_diff: 3456, assist_diff: 123, donation_diff: 200, power_diff: 100, participated: true, is_new_member: true, is_absent: false },
    { id: '10', member_id: 'm10', member_name: '缺席者A', group: '三組', contribution_diff: 0, merit_diff: 0, assist_diff: 0, donation_diff: 0, power_diff: 0, participated: false, is_new_member: false, is_absent: true },
  ] satisfies EventMemberMetric[],
  merit_distribution: [
    { range: '0', min_value: 0, max_value: 0, count: 25 },
    { range: '1-2k', min_value: 1, max_value: 2000, count: 15 },
    { range: '2k-4k', min_value: 2000, max_value: 4000, count: 25 },
    { range: '4k-6k', min_value: 4000, max_value: 6000, count: 35 },
    { range: '6k-8k', min_value: 6000, max_value: 8000, count: 30 },
    { range: '8k-10k', min_value: 8000, max_value: 10000, count: 25 },
    { range: '10k+', min_value: 10000, max_value: 999999, count: 13 },
  ],
}

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  readonly onCreateEvent: () => void
}

function EmptyState({ onCreateEvent }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Swords className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">尚無事件記錄</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          建立戰役事件來追蹤成員在特定戰鬥中的表現，分析出席率和戰功貢獻。
        </p>
        <Button onClick={onCreateEvent}>
          <Plus className="h-4 w-4 mr-2" />
          新增事件
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

function EventAnalytics() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  // Get active season
  const { data: seasons, isLoading: seasonsLoading } = useSeasons()
  const activeSeason = seasons?.find((s) => s.is_active)

  // TODO: Replace with real API hook
  const isLoading = seasonsLoading
  const events = MOCK_EVENTS

  // Sort events by date (newest first)
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aDate = a.event_start ? new Date(a.event_start).getTime() : 0
      const bDate = b.event_start ? new Date(b.event_start).getTime() : 0
      return bDate - aDate
    })
  }, [events])

  // Get selected event detail (mock - in real app, fetch based on selectedEventId)
  const selectedEventDetail = selectedEventId ? MOCK_EVENT_DETAIL : null

  // Get event detail for expanded cards
  // TODO: Replace with real API hook that fetches by eventId
  const getEventDetail = (eventId: string) => {
    // Mock: return same data regardless of eventId (real impl would fetch)
    void eventId
    return {
      summary: MOCK_EVENT_DETAIL.summary,
      metrics: MOCK_EVENT_DETAIL.metrics,
      merit_distribution: MOCK_EVENT_DETAIL.merit_distribution,
    }
  }

  const handleViewDetail = (eventId: string) => {
    setSelectedEventId(eventId)
  }

  const handleCloseDetail = () => {
    setSelectedEventId(null)
  }

  const handleCreateEvent = () => {
    setShowCreateDialog(true)
  }

  return (
    <AllianceGuard>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">事件分析</h2>
            <p className="text-muted-foreground mt-1">
              追蹤特定戰役或事件的成員表現
              {activeSeason && (
                <span className="ml-2">
                  · 賽季: <span className="font-medium text-foreground">{activeSeason.name}</span>
                </span>
              )}
            </p>
          </div>
          <Button onClick={handleCreateEvent}>
            <Plus className="h-4 w-4 mr-2" />
            新增事件
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && <LoadingSkeleton />}

        {/* Empty State */}
        {!isLoading && sortedEvents.length === 0 && (
          <EmptyState onCreateEvent={handleCreateEvent} />
        )}

        {/* Event List */}
        {!isLoading && sortedEvents.length > 0 && (
          <div className="space-y-4">
            {sortedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                eventDetail={getEventDetail(event.id)}
                onViewDetail={handleViewDetail}
              />
            ))}
          </div>
        )}

        {/* Create Event Dialog */}
        <CreateEventDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          seasonId={activeSeason?.id}
        />

        {/* Event Detail Sheet */}
        <EventDetailSheet
          open={selectedEventId !== null}
          onOpenChange={(open) => !open && handleCloseDetail()}
          eventDetail={selectedEventDetail}
        />
      </div>
    </AllianceGuard>
  )
}

export default EventAnalytics
