/**
 * User Role Hook
 *
 * 符合 CLAUDE.md 🔴:
 * - TanStack Query for server state
 * - Type-safe hook
 * - Permission helpers
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAlliance } from '@/hooks/use-alliance'

/**
 * User roles in alliance
 */
export type UserRole = 'owner' | 'collaborator' | 'member'

/**
 * Permission helpers
 */
export const permissions = {
  /**
   * Can manage collaborators (add, remove, update roles)
   */
  canManageCollaborators: (role: UserRole | null): boolean => {
    return role === 'owner'
  },

  /**
   * Can upload CSV data
   */
  canUploadData: (role: UserRole | null): boolean => {
    return role === 'owner' || role === 'collaborator'
  },

  /**
   * Can manage seasons (create, update, delete, activate)
   */
  canManageSeasons: (role: UserRole | null): boolean => {
    return role === 'owner' || role === 'collaborator'
  },

  /**
   * Can manage hegemony weights
   */
  canManageWeights: (role: UserRole | null): boolean => {
    return role === 'owner' || role === 'collaborator'
  },

  /**
   * Can update alliance settings
   */
  canUpdateAlliance: (role: UserRole | null): boolean => {
    return role === 'owner' || role === 'collaborator'
  },

  /**
   * Can delete alliance
   */
  canDeleteAlliance: (role: UserRole | null): boolean => {
    return role === 'owner'
  },

  /**
   * Can view data (all members)
   */
  canViewData: (role: UserRole | null): boolean => {
    return role === 'owner' || role === 'collaborator' || role === 'member'
  }
}

/**
 * Hook to get current user's role in alliance
 *
 * @returns User role query
 */
export function useUserRole() {
  const { data: alliance } = useAlliance()

  return useQuery({
    queryKey: ['user-role', alliance?.id],
    queryFn: async () => {
      if (!alliance) {
        throw new Error('No alliance found')
      }
      const response = await apiClient.getMyRole(alliance.id)
      return response.role as UserRole
    },
    enabled: !!alliance,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false
  })
}

/**
 * Hook to check specific permission
 *
 * @param permissionCheck - Permission check function
 * @returns Boolean indicating if user has permission
 */
export function usePermission(
  permissionCheck: (role: UserRole | null) => boolean
): boolean {
  const { data: role } = useUserRole()
  return permissionCheck(role ?? null)
}

/**
 * Convenience hooks for common permissions
 */
export function useCanManageCollaborators(): boolean {
  return usePermission(permissions.canManageCollaborators)
}

export function useCanUploadData(): boolean {
  return usePermission(permissions.canUploadData)
}

export function useCanManageSeasons(): boolean {
  return usePermission(permissions.canManageSeasons)
}

export function useCanManageWeights(): boolean {
  return usePermission(permissions.canManageWeights)
}

export function useCanUpdateAlliance(): boolean {
  return usePermission(permissions.canUpdateAlliance)
}

export function useCanDeleteAlliance(): boolean {
  return usePermission(permissions.canDeleteAlliance)
}
