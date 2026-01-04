/**
 * ViewModeToggle - Shared Analytics View Mode Selector
 *
 * Toggle between "latest period" and "season-to-date" view modes.
 * Used across MemberPerformance, GroupAnalytics, and AllianceAnalytics pages.
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

/** View mode for analytics data display */
export type ViewMode = 'latest' | 'season'

interface ViewModeToggleProps {
  readonly value: ViewMode
  readonly onChange: (value: ViewMode) => void
  /** Optional className for positioning */
  readonly className?: string
}

export function ViewModeToggle({ value, onChange, className }: ViewModeToggleProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as ViewMode)}
      className={className}
    >
      <TabsList className="h-8">
        <TabsTrigger value="latest" className="text-xs px-3">
          最新一期
        </TabsTrigger>
        <TabsTrigger value="season" className="text-xs px-3">
          賽季以來
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
