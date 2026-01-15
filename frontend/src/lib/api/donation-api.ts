import { axiosInstance } from './base-client'

export type DonationType = 'regular' | 'penalty'
export type DonationStatus = 'active' | 'completed' | 'cancelled'

export interface DonationListItem {
  id: string
  season_id: string
  alliance_id: string
  title: string
  type: DonationType
  deadline: string
  target_amount: number
  description: string | null
  status: DonationStatus
  created_at: string
  created_by: string | null
  updated_at: string
}

export interface DonationMemberInfo {
  member_id: string
  member_name: string
  target_amount: number
  donated_amount: number
}

export interface DonationDetail extends DonationListItem {
  member_info: DonationMemberInfo[]
}

export interface CreateDonationPayload {
  title: string
  type: DonationType
  deadline: string
  target_amount: number
  description?: string
}

export interface TargetOverridePayload {
  member_id: string
  target_amount: number
}

const basePath = '/api/v1/donations'

export async function getDonations(allianceId: string, seasonId: string): Promise<DonationListItem[]> {
  const params = new URLSearchParams({ alliance_id: String(allianceId), season_id: String(seasonId) })
  const response = await axiosInstance.get<DonationListItem[]>(`${basePath}?${params.toString()}`)
  return response.data
}

export async function getDonationDetail(donationId: string): Promise<DonationDetail> {
  const response = await axiosInstance.get<DonationDetail>(`${basePath}/${donationId}`)
  return response.data
}

export async function createDonation(allianceId: string, seasonId: string, payload: CreateDonationPayload): Promise<DonationListItem> {
  const params = new URLSearchParams({ alliance_id: String(allianceId), season_id: String(seasonId) })
  const response = await axiosInstance.post<DonationListItem>(`${basePath}?${params.toString()}`, payload)
  return response.data
}

export async function deleteDonation(donationId: string): Promise<void> {
  await axiosInstance.delete(`${basePath}/${donationId}`)
}

export async function upsertMemberTargetOverride(donationId: string, payload: TargetOverridePayload): Promise<void> {
  await axiosInstance.post(`${basePath}/${donationId}/targets`, payload)
}

export async function deleteMemberTargetOverride(donationId: string, memberId: string): Promise<void> {
  await axiosInstance.delete(`${basePath}/${donationId}/targets/${memberId}`)
}
