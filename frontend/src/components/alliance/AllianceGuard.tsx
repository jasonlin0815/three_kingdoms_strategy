/**
 * Alliance Guard Component
 *
 * 檢查用戶是否已設定同盟
 * 如果沒有同盟，顯示設定表單
 * 如果有同盟，顯示子組件
 *
 * Performance: Uses Skeleton for better perceived loading experience
 *
 * 符合 CLAUDE.md 🔴: ES imports only, explicit TypeScript interfaces, function declarations
 */

import type { ReactNode } from 'react'
import { useAlliance } from '@/hooks/use-alliance'
import { AllianceSetupForm } from './AllianceSetupForm'
import { Skeleton } from '@/components/ui/skeleton'

interface AllianceGuardProps {
  readonly children: ReactNode
}

/**
 * Loading skeleton that matches typical page structure
 */
function AllianceLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  )
}

export function AllianceGuard({ children }: AllianceGuardProps) {
  const { data: alliance, isLoading, isFetched } = useAlliance()

  // Show skeleton during initial load
  if (isLoading) {
    return (
      <div className="min-h-[400px]">
        <AllianceLoadingSkeleton />
      </div>
    )
  }

  // After fetch completes, if no alliance, show setup form
  if (isFetched && !alliance) {
    return (
      <div className="flex min-h-[400px] items-center justify-center py-8">
        <AllianceSetupForm />
      </div>
    )
  }

  // Alliance exists, render children
  return <>{children}</>
}
