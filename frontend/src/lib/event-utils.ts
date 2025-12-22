/**
 * Event Utilities - Shared helper functions for battle events
 *
 * Centralized utilities to avoid DRY violations across:
 * - EventCard.tsx
 * - EventDetailSheet.tsx
 * - EventAnalytics.tsx
 */

import {
  Swords,
  Shield,
  Zap,
  Map,
  Skull,
  Flag,
  type LucideIcon,
} from 'lucide-react'
import type { EventType } from '@/types/event'
import { EVENT_TYPE_CONFIG } from '@/types/event'

/**
 * Get the appropriate icon component for an event type
 */
export function getEventIcon(eventType: EventType): LucideIcon {
  switch (eventType) {
    case 'siege':
      return Swords
    case 'defense':
      return Shield
    case 'raid':
      return Zap
    case 'territory':
      return Map
    case 'boss':
      return Skull
    case 'custom':
      return Flag
  }
}

/**
 * Format event time range
 *
 * @param start - ISO timestamp for event start
 * @param end - ISO timestamp for event end
 * @param options.includeDuration - Whether to include duration calculation (default: false)
 * @param options.includeYear - Whether to include year in date (default: false)
 */
export function formatEventTime(
  start: string | null,
  end: string | null,
  options: { includeDuration?: boolean; includeYear?: boolean } = {}
): string {
  const { includeDuration = false, includeYear = false } = options

  if (!start) return '未設定時間'

  const startDate = new Date(start)
  const dateStr = startDate.toLocaleDateString('zh-TW', {
    year: includeYear ? 'numeric' : undefined,
    month: 'numeric',
    day: 'numeric',
  })
  const startTime = startDate.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  if (!end) return `${dateStr} ${startTime}`

  const endDate = new Date(end)
  const endTime = endDate.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  if (!includeDuration) {
    return `${dateStr} ${startTime}-${endTime}`
  }

  // Calculate duration
  const durationMs = endDate.getTime() - startDate.getTime()
  const hours = Math.floor(durationMs / (1000 * 60 * 60))
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
  const durationStr = hours > 0
    ? `${hours}小時${minutes > 0 ? minutes + '分鐘' : ''}`
    : `${minutes}分鐘`

  return `${dateStr} ${startTime} - ${endTime} (${durationStr})`
}

/**
 * Get badge variant for event type
 */
export function getEventTypeBadgeVariant(
  eventType: EventType
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (EVENT_TYPE_CONFIG[eventType].color) {
    case 'primary':
      return 'default'
    case 'blue':
    case 'green':
    case 'purple':
      return 'secondary'
    case 'yellow':
      return 'outline'
    default:
      return 'secondary'
  }
}

// Re-export EVENT_TYPE_CONFIG for convenience
export { EVENT_TYPE_CONFIG }
