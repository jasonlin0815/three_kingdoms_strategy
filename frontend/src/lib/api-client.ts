/**
 * API Client for backend communication
 *
 * 符合 CLAUDE.md 🔴:
 * - Type-safe API calls
 * - Error handling with Type Guards
 * - snake_case field naming
 */

import axios, { type AxiosInstance } from 'axios'
import type { Alliance, AllianceCreate, AllianceUpdate } from '@/types/alliance'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8087'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    })
  }

  /**
   * Set authorization token for authenticated requests
   */
  setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete this.client.defaults.headers.common['Authorization']
    }
  }

  // ==================== Alliance API ====================

  /**
   * Get current user's alliance
   */
  async getAlliance(): Promise<Alliance | null> {
    const response = await this.client.get<Alliance | null>('/api/v1/alliances')
    return response.data
  }

  /**
   * Create new alliance
   */
  async createAlliance(data: AllianceCreate): Promise<Alliance> {
    const response = await this.client.post<Alliance>('/api/v1/alliances', data)
    return response.data
  }

  /**
   * Update alliance
   */
  async updateAlliance(data: AllianceUpdate): Promise<Alliance> {
    const response = await this.client.patch<Alliance>('/api/v1/alliances', data)
    return response.data
  }

  /**
   * Delete alliance
   */
  async deleteAlliance(): Promise<void> {
    await this.client.delete('/api/v1/alliances')
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
