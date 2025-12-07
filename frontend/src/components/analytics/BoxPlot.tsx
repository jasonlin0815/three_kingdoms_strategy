/**
 * BoxPlot - Reusable box plot visualization component
 *
 * Supports two modes:
 * 1. Single box plot with optional strip plot (individual data points)
 * 2. Multiple box plots for group comparison
 *
 * Box plot shows: Min / Q1 / Median / Q3 / Max
 */

import { useState } from 'react'
import { formatNumber, formatNumberCompact } from '@/lib/chart-utils'

// ============================================================================
// Types
// ============================================================================

export interface BoxPlotStats {
  readonly min: number
  readonly q1: number
  readonly median: number
  readonly q3: number
  readonly max: number
}

export interface StripPlotPoint {
  readonly id: string
  readonly name: string
  readonly value: number
}

interface BoxPlotProps {
  readonly stats: BoxPlotStats
  /** Optional strip plot data points */
  readonly points?: readonly StripPlotPoint[]
  /** Color theme: primary, chart-2, chart-3, etc. */
  readonly color?: string
  /** Whether to show value labels */
  readonly showLabels?: boolean
  /** Custom range for scaling (useful when comparing multiple box plots) */
  readonly scaleRange?: { min: number; max: number }
}

interface BoxPlotComparisonProps {
  readonly items: readonly {
    readonly name: string
    readonly stats: BoxPlotStats
  }[]
  /** Color theme */
  readonly color?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculatePosition(value: number, min: number, max: number): number {
  if (max === min) return 50
  return ((value - min) / (max - min)) * 100
}

// ============================================================================
// Single BoxPlot Component
// ============================================================================

export function BoxPlot({
  stats,
  points,
  color = 'primary',
  showLabels = true,
  scaleRange,
}: BoxPlotProps) {
  const [hoveredPoint, setHoveredPoint] = useState<StripPlotPoint | null>(null)

  const rangeMin = scaleRange?.min ?? stats.min
  const rangeMax = scaleRange?.max ?? stats.max

  const getPosition = (value: number) => calculatePosition(value, rangeMin, rangeMax)

  const minPct = getPosition(stats.min)
  const q1Pct = getPosition(stats.q1)
  const medianPct = getPosition(stats.median)
  const q3Pct = getPosition(stats.q3)
  const maxPct = getPosition(stats.max)

  const colorClass = `var(--${color})`

  return (
    <div className="space-y-2">
      {/* Top labels */}
      {showLabels && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatNumber(stats.min)}</span>
          <span>{formatNumber(stats.median)}</span>
          <span>{formatNumber(stats.max)}</span>
        </div>
      )}

      {/* Box Plot */}
      <div className="relative h-8">
        {/* Full range bar */}
        <div className="absolute inset-y-2 left-0 right-0 bg-muted rounded" />
        {/* Whisker line (min to max) */}
        <div
          className="absolute top-1/2 h-px -translate-y-1/2"
          style={{
            left: `${minPct}%`,
            right: `${100 - maxPct}%`,
            backgroundColor: colorClass,
            opacity: 0.5,
          }}
        />
        {/* Min whisker cap */}
        <div
          className="absolute top-2 bottom-2 w-px"
          style={{ left: `${minPct}%`, backgroundColor: colorClass, opacity: 0.5 }}
        />
        {/* Max whisker cap */}
        <div
          className="absolute top-2 bottom-2 w-px"
          style={{ left: `${maxPct}%`, backgroundColor: colorClass, opacity: 0.5 }}
        />
        {/* IQR box */}
        <div
          className="absolute inset-y-1 rounded border-2"
          style={{
            left: `${q1Pct}%`,
            right: `${100 - q3Pct}%`,
            backgroundColor: `color-mix(in srgb, ${colorClass} 20%, transparent)`,
            borderColor: colorClass,
          }}
        />
        {/* Median line */}
        <div
          className="absolute inset-y-0 w-0.5"
          style={{ left: `${medianPct}%`, backgroundColor: colorClass }}
        />
      </div>

      {/* Strip Plot - Individual data points */}
      {points && points.length > 0 && (
        <div className="relative h-6">
          {points.map((point) => {
            const position = getPosition(point.value)
            const isHovered = hoveredPoint?.id === point.id
            return (
              <div
                key={point.id}
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full cursor-pointer transition-transform z-10 hover:scale-150"
                style={{
                  left: `calc(${position}% - 5px)`,
                  backgroundColor: `color-mix(in srgb, ${colorClass} 70%, transparent)`,
                }}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-popover border shadow-md text-xs whitespace-nowrap z-20">
                    <div className="font-medium">{point.name}</div>
                    <div className="text-muted-foreground">
                      {formatNumber(point.value)}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom labels */}
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Min</span>
          <span>Q1: {formatNumber(stats.q1)}</span>
          <span>Q3: {formatNumber(stats.q3)}</span>
          <span>Max</span>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// BoxPlot Comparison Component (multiple groups)
// ============================================================================

export function BoxPlotComparison({ items, color = 'primary' }: BoxPlotComparisonProps) {
  // Calculate global range for consistent scaling across all items
  const allValues = items.flatMap((item) => [item.stats.min, item.stats.max])
  const globalMin = Math.min(...allValues)
  const globalMax = Math.max(...allValues)

  const getPosition = (value: number) => calculatePosition(value, globalMin, globalMax)

  const colorClass = `var(--${color})`

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const minPct = getPosition(item.stats.min)
        const q1Pct = getPosition(item.stats.q1)
        const medianPct = getPosition(item.stats.median)
        const q3Pct = getPosition(item.stats.q3)
        const maxPct = getPosition(item.stats.max)

        return (
          <div key={item.name} className="space-y-1">
            {/* Row header */}
            <div className="flex justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground tabular-nums">
                Med: {formatNumberCompact(item.stats.median)}
              </span>
            </div>

            {/* Box Plot Row */}
            <div className="relative h-6">
              {/* Whisker line (min to max) */}
              <div
                className="absolute top-1/2 h-px -translate-y-1/2"
                style={{
                  left: `${minPct}%`,
                  right: `${100 - maxPct}%`,
                  backgroundColor: colorClass,
                  opacity: 0.5,
                }}
              />
              {/* Min whisker cap */}
              <div
                className="absolute top-1 bottom-1 w-px"
                style={{ left: `${minPct}%`, backgroundColor: colorClass, opacity: 0.5 }}
              />
              {/* Max whisker cap */}
              <div
                className="absolute top-1 bottom-1 w-px"
                style={{ left: `${maxPct}%`, backgroundColor: colorClass, opacity: 0.5 }}
              />
              {/* IQR box (Q1 to Q3) */}
              <div
                className="absolute top-0.5 bottom-0.5 rounded-sm border"
                style={{
                  left: `${q1Pct}%`,
                  right: `${100 - q3Pct}%`,
                  backgroundColor: `color-mix(in srgb, ${colorClass} 20%, transparent)`,
                  borderColor: colorClass,
                }}
              />
              {/* Median line */}
              <div
                className="absolute top-0 bottom-0 w-0.5"
                style={{ left: `${medianPct}%`, backgroundColor: colorClass }}
              />
            </div>

            {/* Value labels */}
            <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>{formatNumberCompact(item.stats.min)}</span>
              <span>Q1: {formatNumberCompact(item.stats.q1)}</span>
              <span>Q3: {formatNumberCompact(item.stats.q3)}</span>
              <span>{formatNumberCompact(item.stats.max)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
