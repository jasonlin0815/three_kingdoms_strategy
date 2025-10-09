/**
 * Alliance Guard Component
 *
 * 檢查用戶是否已設定同盟
 * 如果沒有同盟，顯示設定表單
 * 如果有同盟，顯示子組件
 *
 * 符合 CLAUDE.md 🔴: ES imports only, explicit TypeScript interfaces
 */

import type { ReactNode } from 'react'
import { useAlliance } from '@/hooks/use-alliance'
import { AllianceSetupForm } from './AllianceSetupForm'

interface AllianceGuardProps {
  readonly children: ReactNode
}

export const AllianceGuard: React.FC<AllianceGuardProps> = ({ children }) => {
  const { data: alliance, isLoading } = useAlliance()

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    )
  }

  // If no alliance, show setup form
  if (!alliance) {
    return (
      <div className="flex min-h-[400px] items-center justify-center py-8">
        <AllianceSetupForm />
      </div>
    )
  }

  // Alliance exists, render children
  return <>{children}</>
}
