/**
 * Subscription API Types
 *
 * 符合 CLAUDE.md 🟡: snake_case naming matching backend schema
 */

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled'

export interface SubscriptionStatusResponse {
  readonly status: SubscriptionStatus
  readonly is_active: boolean
  readonly is_trial: boolean
  readonly is_trial_active: boolean
  readonly days_remaining: number | null
  readonly trial_ends_at: string | null
  readonly subscription_plan: string | null
  readonly subscription_ends_at: string | null
}

/**
 * Helper type for subscription warning levels
 */
export type TrialWarningLevel = 'none' | 'warning' | 'critical' | 'expired'

/**
 * Helper function to determine trial warning level
 */
export function getTrialWarningLevel(
  daysRemaining: number | null,
  isTrialActive: boolean
): TrialWarningLevel {
  if (!isTrialActive) return 'expired'
  if (daysRemaining === null) return 'none'
  if (daysRemaining <= 0) return 'expired'
  if (daysRemaining <= 3) return 'critical'
  if (daysRemaining <= 7) return 'warning'
  return 'none'
}
