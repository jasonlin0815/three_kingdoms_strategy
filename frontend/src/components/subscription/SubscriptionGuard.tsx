/**
 * Subscription Guard Component
 *
 * Checks if user's subscription/trial is active
 * If expired, shows upgrade prompt instead of children
 * If active, renders children normally
 *
 * 符合 CLAUDE.md 🔴: ES imports only, explicit TypeScript interfaces, function declarations
 */

import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { useSubscription } from '@/hooks/use-subscription'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface SubscriptionGuardProps {
  readonly children: ReactNode
  /**
   * Custom message to show when subscription is expired
   */
  readonly expiredMessage?: string
  /**
   * If true, shows a softer inline message instead of blocking content
   * Useful for partial restrictions
   */
  readonly inline?: boolean
}

/**
 * Expired subscription overlay
 */
function ExpiredOverlay({ message }: { readonly message: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center py-8">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold">訂閱已過期</h3>
        <p className="text-muted-foreground">{message}</p>
        <Button variant="default" disabled>
          升級方案（即將推出）
        </Button>
      </div>
    </div>
  )
}

/**
 * Inline expired message for partial restrictions
 */
function ExpiredInline({ message }: { readonly message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>訂閱已過期</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

export function SubscriptionGuard({
  children,
  expiredMessage = '您的試用期或訂閱已過期，請升級以繼續使用完整功能。',
  inline = false,
}: SubscriptionGuardProps) {
  const { data, isLoading } = useSubscription()

  // While loading, render children to avoid flash of expired state
  if (isLoading || !data) {
    return <>{children}</>
  }

  // If subscription is active, render children
  if (data.is_active) {
    return <>{children}</>
  }

  // Subscription expired, show appropriate message
  if (inline) {
    return <ExpiredInline message={expiredMessage} />
  }

  return <ExpiredOverlay message={expiredMessage} />
}
