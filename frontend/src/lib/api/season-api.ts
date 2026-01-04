/**
 * Season API
 *
 * Season CRUD and activation endpoints.
 */

import { axiosInstance } from './base-client'
import type { Season, SeasonCreate, SeasonUpdate } from '@/types/season'

export async function getSeasons(activeOnly: boolean = false): Promise<Season[]> {
  const response = await axiosInstance.get<Season[]>('/api/v1/seasons', {
    params: { active_only: activeOnly }
  })
  return response.data
}

export async function getActiveSeason(): Promise<Season | null> {
  const response = await axiosInstance.get<Season | null>('/api/v1/seasons/active')
  return response.data
}

export async function getSeason(seasonId: string): Promise<Season> {
  const response = await axiosInstance.get<Season>(`/api/v1/seasons/${seasonId}`)
  return response.data
}

export async function createSeason(data: SeasonCreate): Promise<Season> {
  const response = await axiosInstance.post<Season>('/api/v1/seasons', data)
  return response.data
}

export async function updateSeason(seasonId: string, data: SeasonUpdate): Promise<Season> {
  const response = await axiosInstance.patch<Season>(`/api/v1/seasons/${seasonId}`, data)
  return response.data
}

export async function deleteSeason(seasonId: string): Promise<void> {
  await axiosInstance.delete(`/api/v1/seasons/${seasonId}`)
}

export async function activateSeason(seasonId: string): Promise<Season> {
  const response = await axiosInstance.post<Season>(`/api/v1/seasons/${seasonId}/activate`)
  return response.data
}
