/**
 * Subscription Query Hooks
 *
 * 符合 CLAUDE.md 🟡:
 * - TanStack Query for server state
 * - Type-safe hooks
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { TrialWarningLevel } from '@/types/subscription'
import { getTrialWarningLevel } from '@/types/subscription'

// Query Keys Factory
export const subscriptionKeys = {
  all: ['subscription'] as const,
  status: () => [...subscriptionKeys.all, 'status'] as const,
}

/**
 * Hook to fetch current user's subscription status
 */
export function useSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.status(),
    queryFn: () => apiClient.getSubscriptionStatus(),
    staleTime: 60 * 1000, // 1 minute - subscription status doesn't change often
    retry: 1, // Only retry once for subscription checks
  })
}

/**
 * Hook to check if user can perform write operations
 *
 * Returns true if trial/subscription is active
 */
export function useCanWrite(): boolean {
  const { data } = useSubscription()
  return data?.is_active ?? false
}

/**
 * Hook to get trial warning information
 *
 * Returns warning level and days remaining for UI display
 */
export function useTrialWarning(): {
  level: TrialWarningLevel
  daysRemaining: number | null
  isExpired: boolean
  message: string | null
} {
  const { data } = useSubscription()

  if (!data) {
    return {
      level: 'none',
      daysRemaining: null,
      isExpired: false,
      message: null,
    }
  }

  const level = getTrialWarningLevel(data.days_remaining, data.is_trial_active)
  const isExpired = !data.is_active

  let message: string | null = null
  if (level === 'expired' || isExpired) {
    if (data.is_trial) {
      message = '您的 14 天試用期已結束，請升級以繼續使用完整功能。'
    } else {
      message = '您的訂閱已過期，請續訂以繼續使用完整功能。'
    }
  } else if (level === 'critical') {
    message = `試用期即將結束！還剩 ${data.days_remaining} 天。`
  } else if (level === 'warning') {
    message = `試用期還剩 ${data.days_remaining} 天，請考慮升級。`
  }

  return {
    level,
    daysRemaining: data.days_remaining,
    isExpired,
    message,
  }
}

/**
 * Hook to get subscription status for display
 *
 * Returns formatted subscription information for UI
 */
export function useSubscriptionDisplay(): {
  status: string
  statusColor: 'green' | 'yellow' | 'red' | 'gray'
  planName: string | null
  endDate: string | null
} {
  const { data } = useSubscription()

  if (!data) {
    return {
      status: '載入中...',
      statusColor: 'gray',
      planName: null,
      endDate: null,
    }
  }

  let status: string
  let statusColor: 'green' | 'yellow' | 'red' | 'gray'

  if (data.is_active) {
    if (data.is_trial) {
      status = `試用中 (${data.days_remaining} 天)`
      statusColor = data.days_remaining && data.days_remaining <= 3 ? 'yellow' : 'green'
    } else {
      status = '已訂閱'
      statusColor = 'green'
    }
  } else {
    status = data.is_trial ? '試用已過期' : '訂閱已過期'
    statusColor = 'red'
  }

  return {
    status,
    statusColor,
    planName: data.subscription_plan,
    endDate: data.is_trial ? data.trial_ends_at : data.subscription_ends_at,
  }
}
