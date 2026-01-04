/**
 * Alliance API
 *
 * Alliance CRUD and collaborator management endpoints.
 */

import { axiosInstance } from './base-client'
import type { Alliance, AllianceCreate, AllianceUpdate } from '@/types/alliance'
import type {
  AllianceCollaborator,
  AllianceCollaboratorCreate,
  AllianceCollaboratorsResponse
} from '@/types/alliance-collaborator'

// ==================== Alliance API ====================

export async function getAlliance(): Promise<Alliance | null> {
  const response = await axiosInstance.get<Alliance | null>('/api/v1/alliances')
  return response.data
}

export async function createAlliance(data: AllianceCreate): Promise<Alliance> {
  const response = await axiosInstance.post<Alliance>('/api/v1/alliances', data)
  return response.data
}

export async function updateAlliance(data: AllianceUpdate): Promise<Alliance> {
  const response = await axiosInstance.patch<Alliance>('/api/v1/alliances', data)
  return response.data
}

export async function deleteAlliance(): Promise<void> {
  await axiosInstance.delete('/api/v1/alliances')
}

// ==================== Alliance Collaborator API ====================

export async function getCollaborators(allianceId: string): Promise<AllianceCollaboratorsResponse> {
  const response = await axiosInstance.get<AllianceCollaboratorsResponse>(
    `/api/v1/alliances/${allianceId}/collaborators`
  )
  return response.data
}

export async function addCollaborator(
  allianceId: string,
  data: AllianceCollaboratorCreate
): Promise<AllianceCollaborator> {
  const response = await axiosInstance.post<AllianceCollaborator>(
    `/api/v1/alliances/${allianceId}/collaborators`,
    data
  )
  return response.data
}

export async function removeCollaborator(allianceId: string, userId: string): Promise<void> {
  await axiosInstance.delete(`/api/v1/alliances/${allianceId}/collaborators/${userId}`)
}

export async function processPendingInvitations(): Promise<{ processed_count: number; message: string }> {
  const response = await axiosInstance.post<{ processed_count: number; message: string }>(
    '/api/v1/collaborators/process-invitations'
  )
  return response.data
}

export async function updateCollaboratorRole(
  allianceId: string,
  userId: string,
  newRole: string
): Promise<{ id: string; user_id: string; role: string; updated_at: string }> {
  const response = await axiosInstance.patch<{ id: string; user_id: string; role: string; updated_at: string }>(
    `/api/v1/alliances/${allianceId}/collaborators/${userId}/role`,
    null,
    { params: { new_role: newRole } }
  )
  return response.data
}

export async function getMyRole(allianceId: string): Promise<{ role: string }> {
  const response = await axiosInstance.get<{ role: string }>(
    `/api/v1/alliances/${allianceId}/my-role`
  )
  return response.data
}
