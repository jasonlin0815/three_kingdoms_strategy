/**
 * Analytics API
 *
 * Member, group, and alliance analytics endpoints.
 */

import { axiosInstance } from './base-client'
import type {
  MemberListItem,
  MemberTrendItem,
  SeasonSummaryResponse,
  AllianceAveragesResponse,
  AllianceTrendItem,
  GroupListItem,
  GroupAnalyticsResponse,
  GroupComparisonItem,
  AllianceAnalyticsResponse
} from '@/types/analytics'
import type { RecalculateSeasonPeriodsResponse } from '@/types/period'

// ==================== Member Analytics API ====================

export async function getAnalyticsMembers(
  seasonId: string,
  activeOnly: boolean = true
): Promise<MemberListItem[]> {
  const response = await axiosInstance.get<MemberListItem[]>('/api/v1/analytics/members', {
    params: { season_id: seasonId, active_only: activeOnly }
  })
  return response.data
}

export async function getMemberTrend(memberId: string, seasonId: string): Promise<MemberTrendItem[]> {
  const response = await axiosInstance.get<MemberTrendItem[]>(
    `/api/v1/analytics/members/${memberId}/trend`,
    {
      params: { season_id: seasonId }
    }
  )
  return response.data
}

export async function getMemberSeasonSummary(
  memberId: string,
  seasonId: string
): Promise<SeasonSummaryResponse> {
  const response = await axiosInstance.get<SeasonSummaryResponse>(
    `/api/v1/analytics/members/${memberId}/summary`,
    {
      params: { season_id: seasonId }
    }
  )
  return response.data
}

// ==================== Period Analytics API ====================

export async function getPeriodAverages(periodId: string): Promise<AllianceAveragesResponse> {
  const response = await axiosInstance.get<AllianceAveragesResponse>(
    `/api/v1/analytics/periods/${periodId}/averages`
  )
  return response.data
}

export async function recalculateSeasonPeriods(seasonId: string): Promise<RecalculateSeasonPeriodsResponse> {
  const response = await axiosInstance.post<RecalculateSeasonPeriodsResponse>(
    `/api/v1/periods/seasons/${seasonId}/recalculate`
  )
  return response.data
}

// ==================== Alliance Analytics API ====================

export async function getAllianceTrend(seasonId: string): Promise<AllianceTrendItem[]> {
  const response = await axiosInstance.get<AllianceTrendItem[]>('/api/v1/analytics/alliance/trend', {
    params: { season_id: seasonId }
  })
  return response.data
}

export async function getSeasonAverages(seasonId: string): Promise<AllianceAveragesResponse> {
  const response = await axiosInstance.get<AllianceAveragesResponse>(
    `/api/v1/analytics/seasons/${seasonId}/averages`
  )
  return response.data
}

export async function getAllianceAnalytics(
  seasonId: string,
  view: 'latest' | 'season' = 'latest'
): Promise<AllianceAnalyticsResponse> {
  const response = await axiosInstance.get<AllianceAnalyticsResponse>(
    '/api/v1/analytics/alliance',
    {
      params: { season_id: seasonId, view }
    }
  )
  return response.data
}

// ==================== Group Analytics API ====================

export async function getGroups(seasonId: string): Promise<GroupListItem[]> {
  const response = await axiosInstance.get<GroupListItem[]>('/api/v1/analytics/groups', {
    params: { season_id: seasonId }
  })
  return response.data
}

export async function getGroupAnalytics(
  groupName: string,
  seasonId: string,
  view: 'latest' | 'season' = 'latest'
): Promise<GroupAnalyticsResponse> {
  const response = await axiosInstance.get<GroupAnalyticsResponse>(
    `/api/v1/analytics/groups/${encodeURIComponent(groupName)}`,
    {
      params: { season_id: seasonId, view }
    }
  )
  return response.data
}

export async function getGroupsComparison(
  seasonId: string,
  view: 'latest' | 'season' = 'latest'
): Promise<GroupComparisonItem[]> {
  const response = await axiosInstance.get<GroupComparisonItem[]>(
    '/api/v1/analytics/groups/comparison',
    {
      params: { season_id: seasonId, view }
    }
  )
  return response.data
}
