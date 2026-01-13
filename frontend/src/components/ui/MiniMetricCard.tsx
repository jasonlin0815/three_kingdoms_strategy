import type { ReactNode } from 'react'
import { Card, CardContent } from './card'

export interface MiniMetricCardProps {
  readonly title: string
  readonly value: string | number
  readonly subtitle?: string
  readonly icon?: ReactNode
}

export function MiniMetricCard({ title, value, subtitle, icon }: MiniMetricCardProps) {
  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-lg font-bold tabular-nums mt-0.5">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
