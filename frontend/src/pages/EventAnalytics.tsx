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
import { useEvents, useEventAnalytics } from '@/hooks/use-events'
import { Plus, Swords } from 'lucide-react'
import { CreateEventDialog } from '@/components/events/CreateEventDialog'
import { EventDetailSheet } from '@/components/events/EventDetailSheet'
import { EventCard } from '@/components/events/EventCard'

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

  // Fetch events for the active season
  const { data: events, isLoading: eventsLoading } = useEvents(activeSeason?.id)

  // Fetch selected event analytics
  const { data: selectedEventDetail } = useEventAnalytics(selectedEventId ?? undefined)

  const isLoading = seasonsLoading || eventsLoading

  // Sort events by date (newest first)
  const sortedEvents = useMemo(() => {
    if (!events) return []
    return [...events].sort((a, b) => {
      const aDate = a.event_start ? new Date(a.event_start).getTime() : 0
      const bDate = b.event_start ? new Date(b.event_start).getTime() : 0
      return bDate - aDate
    })
  }, [events])

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
              <EventCardWithData
                key={event.id}
                eventId={event.id}
                event={event}
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
          eventDetail={selectedEventDetail ?? null}
        />
      </div>
    </AllianceGuard>
  )
}

// ============================================================================
// Event Card with Data Fetching
// ============================================================================

import type { EventListItem } from '@/types/event'

interface EventCardWithDataProps {
  readonly eventId: string
  readonly event: EventListItem
  readonly onViewDetail: (eventId: string) => void
}

/**
 * Wrapper component that fetches event analytics for the card preview.
 * Only fetches when card is expanded (lazy loading could be added).
 */
function EventCardWithData({ eventId, event, onViewDetail }: EventCardWithDataProps) {
  // Only fetch analytics for completed events
  const shouldFetch = event.status === 'completed'
  const { data: eventAnalytics } = useEventAnalytics(shouldFetch ? eventId : undefined)

  // Transform API response to match EventCard expected format
  const eventDetail = eventAnalytics
    ? {
        summary: eventAnalytics.summary,
        metrics: eventAnalytics.metrics,
        merit_distribution: eventAnalytics.merit_distribution,
      }
    : null

  return (
    <EventCard
      event={event}
      eventDetail={eventDetail}
      onViewDetail={onViewDetail}
    />
  )
}

export default EventAnalytics
