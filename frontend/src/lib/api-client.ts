/**
 * API Client - Backward Compatibility Re-export
 *
 * This file re-exports from the new modular API structure.
 * All existing imports from '@/lib/api-client' continue to work.
 *
 * The actual implementation is now in '@/lib/api/'.
 */

export { apiClient, setAuthToken } from './api'
