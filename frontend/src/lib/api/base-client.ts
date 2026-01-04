/**
 * Base API Client
 *
 * Shared axios instance with interceptors and auth handling.
 * All feature-specific API modules extend this base.
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8087'

class BaseApiClient {
  protected client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Handle 401 Unauthorized - clear auth state
        if (error.response?.status === 401) {
          this.setAuthToken(null)
          // Redirect to landing handled by AuthContext
        }

        // Handle network errors
        if (!error.response) {
          console.error('Network error:', error.message)
        }

        return Promise.reject(error)
      }
    )
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

  /**
   * Get the axios instance for direct access if needed
   */
  getAxiosInstance(): AxiosInstance {
    return this.client
  }
}

// Singleton instance
export const baseClient = new BaseApiClient()

// Export the axios instance for feature modules
export const axiosInstance = baseClient.getAxiosInstance()

// Export setAuthToken for AuthContext
export const setAuthToken = (token: string | null) => baseClient.setAuthToken(token)
