/**
 * Subscription API
 *
 * Subscription status and management endpoints.
 */

import { axiosInstance } from './base-client'
import type { SubscriptionStatusResponse } from '@/types/subscription'

/**
 * Get current user's alliance subscription status
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  const response = await axiosInstance.get<SubscriptionStatusResponse>('/api/v1/subscriptions')
  return response.data
}
