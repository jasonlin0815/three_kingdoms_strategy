/**
 * Hegemony Weight API
 *
 * Hegemony scoring weight configuration endpoints.
 */

import { axiosInstance } from './base-client'
import type {
  HegemonyWeight,
  HegemonyWeightCreate,
  HegemonyWeightUpdate,
  HegemonyWeightWithSnapshot,
  HegemonyScorePreview,
  SnapshotWeightsSummary
} from '@/types/hegemony-weight'

export async function getHegemonyWeights(seasonId: string): Promise<HegemonyWeightWithSnapshot[]> {
  const response = await axiosInstance.get<HegemonyWeightWithSnapshot[]>(
    '/api/v1/hegemony-weights',
    {
      params: { season_id: seasonId }
    }
  )
  return response.data
}

export async function getHegemonyWeightsSummary(seasonId: string): Promise<SnapshotWeightsSummary> {
  const response = await axiosInstance.get<SnapshotWeightsSummary>(
    '/api/v1/hegemony-weights/summary',
    {
      params: { season_id: seasonId }
    }
  )
  return response.data
}

export async function initializeHegemonyWeights(seasonId: string): Promise<HegemonyWeight[]> {
  const response = await axiosInstance.post<HegemonyWeight[]>(
    '/api/v1/hegemony-weights/initialize',
    null,
    {
      params: { season_id: seasonId }
    }
  )
  return response.data
}

export async function createHegemonyWeight(
  seasonId: string,
  data: HegemonyWeightCreate
): Promise<HegemonyWeight> {
  const response = await axiosInstance.post<HegemonyWeight>(
    '/api/v1/hegemony-weights',
    data,
    {
      params: { season_id: seasonId }
    }
  )
  return response.data
}

export async function updateHegemonyWeight(
  weightId: string,
  data: HegemonyWeightUpdate
): Promise<HegemonyWeight> {
  const response = await axiosInstance.patch<HegemonyWeight>(
    `/api/v1/hegemony-weights/${weightId}`,
    data
  )
  return response.data
}

export async function deleteHegemonyWeight(weightId: string): Promise<void> {
  await axiosInstance.delete(`/api/v1/hegemony-weights/${weightId}`)
}

export async function previewHegemonyScores(
  seasonId: string,
  limit: number = 10
): Promise<HegemonyScorePreview[]> {
  const response = await axiosInstance.get<HegemonyScorePreview[]>(
    '/api/v1/hegemony-weights/preview',
    {
      params: {
        season_id: seasonId,
        limit
      }
    }
  )
  return response.data
}
