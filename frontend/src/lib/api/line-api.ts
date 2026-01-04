/**
 * LINE Binding API
 *
 * LINE group and member binding endpoints.
 */

import { axiosInstance } from './base-client'
import type {
  LineBindingCode,
  LineBindingStatusResponse,
  RegisteredMembersResponse
} from '@/types/line-binding'

export async function getLineBindingStatus(): Promise<LineBindingStatusResponse> {
  const response = await axiosInstance.get<LineBindingStatusResponse>(
    '/api/v1/linebot/binding'
  )
  return response.data
}

export async function generateLineBindingCode(): Promise<LineBindingCode> {
  const response = await axiosInstance.post<LineBindingCode>(
    '/api/v1/linebot/codes'
  )
  return response.data
}

export async function unbindLineGroup(): Promise<void> {
  await axiosInstance.delete('/api/v1/linebot/binding')
}

export async function getRegisteredMembers(): Promise<RegisteredMembersResponse> {
  const response = await axiosInstance.get<RegisteredMembersResponse>(
    '/api/v1/linebot/binding/members'
  )
  return response.data
}
