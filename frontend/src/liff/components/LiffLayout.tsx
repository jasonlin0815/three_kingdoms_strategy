/**
 * LIFF Layout
 *
 * Compact layout for LIFF Tall mode (bottom sheet style).
 * Optimized for ~70% viewport height.
 */

import { Outlet } from 'react-router-dom'
import { useLiffSession, type LiffSession } from '../hooks/use-liff-session'

const LIFF_ID = import.meta.env.VITE_LIFF_ID || ''

type LiffContextType = {
  session: LiffSession
}

export function LiffLayout() {
  const state = useLiffSession(LIFF_ID)

  if (!LIFF_ID) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm text-destructive">LIFF ID not configured</p>
        </div>
      </div>
    )
  }

  if (state.status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm text-destructive">{state.error}</p>
        </div>
      </div>
    )
  }

  if (!state.session.lineGroupId) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            請從 LINE 群組中開啟此頁面
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-background overflow-auto">
      <Outlet context={{ session: state.session } satisfies LiffContextType} />
    </div>
  )
}
