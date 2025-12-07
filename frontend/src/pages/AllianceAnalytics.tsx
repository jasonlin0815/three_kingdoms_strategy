/**
 * AllianceAnalytics - Alliance Performance Analytics Dashboard
 *
 * Alliance-level performance analysis with 3 tabs:
 * 1. Overview: KPIs, trends, health metrics
 * 2. Group Comparison: Cross-group performance ranking
 * 3. Member Distribution: Distribution analysis, top/bottom performers
 *
 * Features ViewMode toggle (latest period vs season average) for fair comparison.
 * This version uses MOCK DATA for UI preview.
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AllianceGuard } from '@/components/alliance/AllianceGuard'
import { RankChangeIndicator } from '@/components/analytics/RankChangeIndicator'
import { BoxPlotComparison } from '@/components/analytics/BoxPlot'
import {
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  GitCompare,
  Users,
  AlertTriangle,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Cell,
  ReferenceLine,
} from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart'
import {
  formatNumber,
  formatNumberCompact,
  calculatePercentDiff,
  expandPeriodsToDaily,
  getPeriodBoundaryTicks,
  formatDateLabel,
} from '@/lib/chart-utils'

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'latest' | 'season'

// ============================================================================
// MOCK DATA
// ============================================================================

// Mock period data (5 periods)
const MOCK_PERIODS = [
  { period_number: 1, period_label: '第一期', start_date: '2024-11-01', end_date: '2024-11-07', days: 7 },
  { period_number: 2, period_label: '第二期', start_date: '2024-11-07', end_date: '2024-11-14', days: 7 },
  { period_number: 3, period_label: '第三期', start_date: '2024-11-14', end_date: '2024-11-21', days: 7 },
  { period_number: 4, period_label: '第四期', start_date: '2024-11-21', end_date: '2024-11-28', days: 7 },
  { period_number: 5, period_label: '第五期', start_date: '2024-11-28', end_date: '2024-12-05', days: 7 },
]

// Mock alliance trend data (per period)
const MOCK_ALLIANCE_TREND = MOCK_PERIODS.map((p, i) => ({
  ...p,
  avg_daily_contribution: 12000 + i * 800,
  avg_daily_merit: 85000 + i * 3500,
  avg_daily_assist: 3200 + i * 200,
  avg_daily_donation: 12000 + i * 800,
  avg_power: 2850000 + i * 120000,
  median_daily_contribution: 10500 + i * 700,
  median_daily_merit: 78000 + i * 3000,
  median_daily_assist: 2800 + i * 180,
  median_daily_donation: 10000 + i * 600,
}))

// Mock season averages (weighted by days)
const MOCK_SEASON_AVERAGES = {
  avg_daily_contribution: 13500,
  avg_daily_merit: 92000,
  avg_daily_assist: 3500,
  avg_daily_donation: 13200,
  avg_power: 3100000,
  median_daily_contribution: 11800,
  median_daily_merit: 84000,
  median_daily_assist: 3100,
  median_daily_donation: 11000,
}

// Mock group data - latest period (with box plot data)
const MOCK_GROUPS_LATEST = [
  { name: '先鋒營', avg_daily_contribution: 18500, avg_daily_merit: 125000, avg_rank: 12, avg_power: 3850000, contribution_cv: 0.35, contribution_min: 8500, contribution_q1: 14000, contribution_median: 18000, contribution_q3: 23000, contribution_max: 28500, merit_min: 55000, merit_q1: 95000, merit_median: 120000, merit_q3: 165000, merit_max: 245000 },
  { name: '騎兵隊', avg_daily_contribution: 14200, avg_daily_merit: 98000, avg_rank: 28, avg_power: 3200000, contribution_cv: 0.42, contribution_min: 6000, contribution_q1: 10500, contribution_median: 14000, contribution_q3: 18000, contribution_max: 23500, merit_min: 42000, merit_q1: 72000, merit_median: 95000, merit_q3: 128000, merit_max: 205000 },
  { name: '謀士團', avg_daily_contribution: 13800, avg_daily_merit: 92000, avg_rank: 35, avg_power: 2980000, contribution_cv: 0.38, contribution_min: 7000, contribution_q1: 10800, contribution_median: 13500, contribution_q3: 17000, contribution_max: 20500, merit_min: 48000, merit_q1: 72000, merit_median: 88000, merit_q3: 115000, merit_max: 178000 },
  { name: '弓箭隊', avg_daily_contribution: 11500, avg_daily_merit: 85000, avg_rank: 45, avg_power: 2750000, contribution_cv: 0.45, contribution_min: 4500, contribution_q1: 8200, contribution_median: 11000, contribution_q3: 15000, contribution_max: 22800, merit_min: 38000, merit_q1: 62000, merit_median: 82000, merit_q3: 108000, merit_max: 198000 },
  { name: '後勤組', avg_daily_contribution: 8500, avg_daily_merit: 62000, avg_rank: 65, avg_power: 2150000, contribution_cv: 0.52, contribution_min: 2800, contribution_q1: 5500, contribution_median: 8000, contribution_q3: 11000, contribution_max: 15000, merit_min: 25000, merit_q1: 45000, merit_median: 58000, merit_q3: 78000, merit_max: 95000 },
  { name: '新兵營', avg_daily_contribution: 5200, avg_daily_merit: 45000, avg_rank: 82, avg_power: 1450000, contribution_cv: 0.65, contribution_min: 1200, contribution_q1: 3000, contribution_median: 4800, contribution_q3: 7000, contribution_max: 12000, merit_min: 15000, merit_q1: 28000, merit_median: 42000, merit_q3: 58000, merit_max: 82000 },
]

// Mock group data - season averages (with box plot data)
const MOCK_GROUPS_SEASON = [
  { name: '先鋒營', avg_daily_contribution: 17800, avg_daily_merit: 120000, avg_rank: 14, avg_power: 3750000, contribution_cv: 0.38, contribution_min: 8000, contribution_q1: 13500, contribution_median: 17500, contribution_q3: 22000, contribution_max: 27000, merit_min: 52000, merit_q1: 92000, merit_median: 115000, merit_q3: 158000, merit_max: 235000 },
  { name: '騎兵隊', avg_daily_contribution: 13500, avg_daily_merit: 94000, avg_rank: 30, avg_power: 3100000, contribution_cv: 0.44, contribution_min: 5500, contribution_q1: 10000, contribution_median: 13200, contribution_q3: 17000, contribution_max: 22000, merit_min: 40000, merit_q1: 70000, merit_median: 91000, merit_q3: 122000, merit_max: 195000 },
  { name: '謀士團', avg_daily_contribution: 13200, avg_daily_merit: 88000, avg_rank: 38, avg_power: 2880000, contribution_cv: 0.40, contribution_min: 6500, contribution_q1: 10200, contribution_median: 12800, contribution_q3: 16000, contribution_max: 19500, merit_min: 45000, merit_q1: 68000, merit_median: 84000, merit_q3: 110000, merit_max: 168000 },
  { name: '弓箭隊', avg_daily_contribution: 10800, avg_daily_merit: 80000, avg_rank: 48, avg_power: 2650000, contribution_cv: 0.48, contribution_min: 4000, contribution_q1: 7500, contribution_median: 10500, contribution_q3: 14000, contribution_max: 21000, merit_min: 35000, merit_q1: 58000, merit_median: 77000, merit_q3: 102000, merit_max: 185000 },
  { name: '後勤組', avg_daily_contribution: 7800, avg_daily_merit: 58000, avg_rank: 68, avg_power: 2050000, contribution_cv: 0.55, contribution_min: 2500, contribution_q1: 5000, contribution_median: 7500, contribution_q3: 10200, contribution_max: 14000, merit_min: 22000, merit_q1: 42000, merit_median: 55000, merit_q3: 72000, merit_max: 88000 },
  { name: '新兵營', avg_daily_contribution: 4800, avg_daily_merit: 42000, avg_rank: 85, avg_power: 1350000, contribution_cv: 0.68, contribution_min: 1000, contribution_q1: 2800, contribution_median: 4500, contribution_q3: 6500, contribution_max: 11000, merit_min: 12000, merit_q1: 25000, merit_median: 40000, merit_q3: 55000, merit_max: 78000 },
]

// Mock top performers - latest period
const MOCK_TOP_PERFORMERS = [
  { name: '張飛', group: '先鋒營', daily_contribution: 28500, daily_merit: 245000, rank: 1, rank_change: 0 },
  { name: '關羽', group: '先鋒營', daily_contribution: 26800, daily_merit: 232000, rank: 2, rank_change: 1 },
  { name: '趙雲', group: '先鋒營', daily_contribution: 25200, daily_merit: 218000, rank: 3, rank_change: -1 },
  { name: '馬超', group: '騎兵隊', daily_contribution: 23500, daily_merit: 205000, rank: 4, rank_change: 2 },
  { name: '黃忠', group: '弓箭隊', daily_contribution: 22800, daily_merit: 198000, rank: 5, rank_change: 0 },
  { name: '魏延', group: '先鋒營', daily_contribution: 21200, daily_merit: 185000, rank: 6, rank_change: -2 },
  { name: '姜維', group: '謀士團', daily_contribution: 20500, daily_merit: 178000, rank: 7, rank_change: 3 },
  { name: '諸葛亮', group: '謀士團', daily_contribution: 19800, daily_merit: 172000, rank: 8, rank_change: 1 },
  { name: '龐統', group: '謀士團', daily_contribution: 19000, daily_merit: 165000, rank: 9, rank_change: -1 },
  { name: '法正', group: '謀士團', daily_contribution: 18200, daily_merit: 158000, rank: 10, rank_change: 0 },
]

// Mock bottom performers - latest period
const MOCK_BOTTOM_PERFORMERS = [
  { name: '糜竺', group: '後勤組', daily_contribution: 2800, daily_merit: 18000, rank: 96, rank_change: -3 },
  { name: '簡雍', group: '新兵營', daily_contribution: 2500, daily_merit: 15000, rank: 97, rank_change: -5 },
  { name: '孫乾', group: '新兵營', daily_contribution: 2200, daily_merit: 12000, rank: 98, rank_change: -2 },
  { name: '糜芳', group: '後勤組', daily_contribution: 1800, daily_merit: 9000, rank: 99, rank_change: -8 },
  { name: '傅士仁', group: '新兵營', daily_contribution: 1200, daily_merit: 5000, rank: 100, rank_change: -4 },
]

// Mock needs attention (rank_change < -10 or contribution < median * 0.5)
const MOCK_NEEDS_ATTENTION = [
  { name: '李嚴', group: '後勤組', daily_contribution: 4500, rank: 58, rank_change: -16, reason: '排名大幅下滑' },
  { name: '孟達', group: '新兵營', daily_contribution: 3200, rank: 78, rank_change: -13, reason: '排名大幅下滑' },
  { name: '糜芳', group: '後勤組', daily_contribution: 1800, rank: 99, rank_change: -8, reason: '貢獻低於中位數50%' },
  { name: '傅士仁', group: '新兵營', daily_contribution: 1200, rank: 100, rank_change: -4, reason: '貢獻低於中位數50%' },
]

// Mock distribution data
const MOCK_CONTRIBUTION_DISTRIBUTION = [
  { range: '0-5K', count: 8 },
  { range: '5-10K', count: 22 },
  { range: '10-15K', count: 35 },
  { range: '15-20K', count: 20 },
  { range: '20-25K', count: 12 },
  { range: '25K+', count: 8 },
]

const MOCK_MERIT_DISTRIBUTION = [
  { range: '0-30K', count: 5 },
  { range: '30-60K', count: 18 },
  { range: '60-90K', count: 32 },
  { range: '90-120K', count: 25 },
  { range: '120-180K', count: 15 },
  { range: '180K+', count: 10 },
]

// Calculated constants
const CURRENT_PERIOD = MOCK_PERIODS[MOCK_PERIODS.length - 1]
const PREV_PERIOD_DATA = MOCK_ALLIANCE_TREND[MOCK_ALLIANCE_TREND.length - 2]
const LATEST_DATA = MOCK_ALLIANCE_TREND[MOCK_ALLIANCE_TREND.length - 1]

// ============================================================================
// Chart Configurations
// ============================================================================

const trendChartConfig = {
  contribution: { label: '人日均貢獻', color: 'var(--primary)' },
  merit: { label: '人日均戰功', color: 'var(--chart-2)' },
  median: { label: '中位數', color: 'var(--muted-foreground)' },
} satisfies ChartConfig

const groupBarConfig = {
  value: { label: '數值', color: 'var(--primary)' },
} satisfies ChartConfig

const distributionConfig = {
  count: { label: '人數', color: 'var(--primary)' },
} satisfies ChartConfig

// ============================================================================
// Helper Components
// ============================================================================

interface KpiCardProps {
  readonly title: string
  readonly value: string | number
  readonly subtitle?: string
  readonly trend?: { value: number; label: string; isPositiveGood?: boolean }
  readonly highlight?: boolean
}

function KpiCard({ title, value, subtitle, trend, highlight }: KpiCardProps) {
  const isPositive = trend && trend.value >= 0
  const trendColor = trend
    ? trend.isPositiveGood !== false
      ? isPositive
        ? 'text-primary'
        : 'text-destructive'
      : isPositive
        ? 'text-destructive'
        : 'text-primary'
    : ''

  return (
    <Card className={highlight ? 'border-primary/50' : ''}>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            {isPositive ? (
              <TrendingUp className={`h-3 w-3 ${trendColor}`} />
            ) : (
              <TrendingDown className={`h-3 w-3 ${trendColor}`} />
            )}
            <span className={`text-xs ${trendColor}`}>
              {isPositive ? '+' : ''}
              {trend.value.toFixed(1)}
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Tab 1: Overview
// ============================================================================

interface OverviewTabProps {
  readonly viewMode: ViewMode
}

function OverviewTab({ viewMode }: OverviewTabProps) {
  // Expand periods to daily data for trend chart
  const dailyTrendData = useMemo(
    () =>
      expandPeriodsToDaily(MOCK_ALLIANCE_TREND, (p) => ({
        contribution: p.avg_daily_contribution,
        merit: p.avg_daily_merit,
        medianContribution: p.median_daily_contribution,
        medianMerit: p.median_daily_merit,
      })),
    []
  )
  const xAxisTicks = useMemo(() => getPeriodBoundaryTicks(MOCK_ALLIANCE_TREND), [])

  // Get data based on view mode
  const data = viewMode === 'latest' ? LATEST_DATA : MOCK_SEASON_AVERAGES
  const prevData = PREV_PERIOD_DATA

  // Calculate changes (only show for latest mode)
  const contributionChange = viewMode === 'latest'
    ? ((LATEST_DATA.avg_daily_contribution - prevData.avg_daily_contribution) / prevData.avg_daily_contribution) * 100
    : null
  const meritChange = viewMode === 'latest'
    ? ((LATEST_DATA.avg_daily_merit - prevData.avg_daily_merit) / prevData.avg_daily_merit) * 100
    : null
  const powerChange = viewMode === 'latest'
    ? ((LATEST_DATA.avg_power - prevData.avg_power) / prevData.avg_power) * 100
    : null

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="人日均貢獻"
          value={formatNumber(data.avg_daily_contribution)}
          subtitle={viewMode === 'season' ? '賽季加權平均' : CURRENT_PERIOD.period_label}
          trend={contributionChange !== null ? { value: contributionChange, label: '% vs 前期' } : undefined}
          highlight
        />
        <KpiCard
          title="人日均戰功"
          value={formatNumber(data.avg_daily_merit)}
          subtitle={viewMode === 'season' ? '賽季加權平均' : CURRENT_PERIOD.period_label}
          trend={meritChange !== null ? { value: meritChange, label: '% vs 前期' } : undefined}
          highlight
        />
        <KpiCard
          title="人日均協助"
          value={formatNumber(data.avg_daily_assist)}
          subtitle={viewMode === 'season' ? '賽季加權平均' : CURRENT_PERIOD.period_label}
        />
        <KpiCard
          title="平均勢力"
          value={formatNumber(data.avg_power)}
          trend={powerChange !== null ? { value: powerChange, label: '% vs 前期' } : undefined}
        />
      </div>

      {/* Trend Charts with Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contribution Trend + Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">貢獻趨勢與分佈</CardTitle>
            <CardDescription>人日均貢獻趨勢與區間分佈</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trend Line */}
            <ChartContainer config={trendChartConfig} className="h-[200px] w-full">
              <LineChart data={dailyTrendData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  ticks={xAxisTicks}
                  tickFormatter={formatDateLabel}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(v) => formatNumberCompact(v)}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{d.dateLabel}</div>
                        <div className="text-sm">平均: {formatNumber(d.contribution)}</div>
                        <div className="text-sm text-muted-foreground">中位數: {formatNumber(d.medianContribution)}</div>
                      </div>
                    )
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="stepAfter"
                  dataKey="contribution"
                  name="人日均貢獻"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="stepAfter"
                  dataKey="medianContribution"
                  name="中位數"
                  stroke="var(--muted-foreground)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ChartContainer>

            {/* Distribution Bar */}
            <div className="border-t pt-4">
              <div className="text-sm font-medium mb-2">區間分佈</div>
              <ChartContainer config={distributionConfig} className="h-[140px] w-full">
                <BarChart data={MOCK_CONTRIBUTION_DISTRIBUTION} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="range" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis tickLine={false} axisLine={false} className="text-xs" width={30} />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="font-medium">{d.range}</div>
                          <div className="text-sm">{d.count} 人</div>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
              <div className="text-xs text-muted-foreground mt-2">
                平均: {formatNumber(data.avg_daily_contribution)} / 中位數: {formatNumber(viewMode === 'latest' ? LATEST_DATA.median_daily_contribution : MOCK_SEASON_AVERAGES.median_daily_contribution)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Merit Trend + Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">戰功趨勢與分佈</CardTitle>
            <CardDescription>人日均戰功趨勢與區間分佈</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trend Line */}
            <ChartContainer config={trendChartConfig} className="h-[200px] w-full">
              <LineChart data={dailyTrendData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  ticks={xAxisTicks}
                  tickFormatter={formatDateLabel}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(v) => formatNumberCompact(v)}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{d.dateLabel}</div>
                        <div className="text-sm">平均: {formatNumber(d.merit)}</div>
                        <div className="text-sm text-muted-foreground">中位數: {formatNumber(d.medianMerit)}</div>
                      </div>
                    )
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="stepAfter"
                  dataKey="merit"
                  name="人日均戰功"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="stepAfter"
                  dataKey="medianMerit"
                  name="中位數"
                  stroke="var(--muted-foreground)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ChartContainer>

            {/* Distribution Bar */}
            <div className="border-t pt-4">
              <div className="text-sm font-medium mb-2">區間分佈</div>
              <ChartContainer config={distributionConfig} className="h-[140px] w-full">
                <BarChart data={MOCK_MERIT_DISTRIBUTION} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="range" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis tickLine={false} axisLine={false} className="text-xs" width={30} />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="font-medium">{d.range}</div>
                          <div className="text-sm">{d.count} 人</div>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="count" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
              <div className="text-xs text-muted-foreground mt-2">
                平均: {formatNumber(data.avg_daily_merit)} / 中位數: {formatNumber(viewMode === 'latest' ? LATEST_DATA.median_daily_merit : MOCK_SEASON_AVERAGES.median_daily_merit)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================================
// Tab 2: Group Comparison
// ============================================================================

interface GroupComparisonTabProps {
  readonly viewMode: ViewMode
}

function GroupComparisonTab({ viewMode }: GroupComparisonTabProps) {
  const [metric, setMetric] = useState<'contribution' | 'merit' | 'rank'>('contribution')
  const [boxPlotMetric, setBoxPlotMetric] = useState<'contribution' | 'merit'>('contribution')

  const groups = viewMode === 'latest' ? MOCK_GROUPS_LATEST : MOCK_GROUPS_SEASON
  const allianceAvg = viewMode === 'latest' ? LATEST_DATA : MOCK_SEASON_AVERAGES

  // Prepare chart data based on selected metric
  const chartData = useMemo(() => {
    const sorted = [...groups].sort((a, b) => {
      if (metric === 'rank') return a.avg_rank - b.avg_rank
      if (metric === 'contribution') return b.avg_daily_contribution - a.avg_daily_contribution
      return b.avg_daily_merit - a.avg_daily_merit
    })
    return sorted.map(g => ({
      name: g.name,
      value: metric === 'contribution' ? g.avg_daily_contribution
        : metric === 'merit' ? g.avg_daily_merit
        : g.avg_rank,
    }))
  }, [groups, metric])

  const referenceValue = metric === 'contribution' ? allianceAvg.avg_daily_contribution
    : metric === 'merit' ? allianceAvg.avg_daily_merit
    : null

  // Prepare box plot data
  const boxPlotItems = useMemo(() => {
    return groups.map(g => ({
      name: g.name,
      stats: boxPlotMetric === 'contribution'
        ? { min: g.contribution_min, q1: g.contribution_q1, median: g.contribution_median, q3: g.contribution_q3, max: g.contribution_max }
        : { min: g.merit_min, q1: g.merit_q1, median: g.merit_median, q3: g.merit_q3, max: g.merit_max },
    }))
  }, [groups, boxPlotMetric])

  return (
    <div className="space-y-6">
      {/* Box Plot Distribution */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">組別分佈對比</CardTitle>
              <CardDescription>各組 Min / Q1 / Median / Q3 / Max</CardDescription>
            </div>
            <Tabs value={boxPlotMetric} onValueChange={(v) => setBoxPlotMetric(v as 'contribution' | 'merit')}>
              <TabsList className="h-8">
                <TabsTrigger value="contribution" className="text-xs px-3">貢獻</TabsTrigger>
                <TabsTrigger value="merit" className="text-xs px-3">戰功</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <BoxPlotComparison items={boxPlotItems} />
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">組別指標對比</CardTitle>
              <CardDescription>
                {metric === 'rank' ? '排名越小越好' : '按數值高低排序'}
              </CardDescription>
            </div>
            <Tabs value={metric} onValueChange={(v) => setMetric(v as 'contribution' | 'merit' | 'rank')}>
              <TabsList className="h-8">
                <TabsTrigger value="contribution" className="text-xs px-3">貢獻</TabsTrigger>
                <TabsTrigger value="merit" className="text-xs px-3">戰功</TabsTrigger>
                <TabsTrigger value="rank" className="text-xs px-3">排名</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={groupBarConfig} className="h-[320px] w-full">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 60, right: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                className="text-xs"
                tickFormatter={(v) => metric === 'rank' ? `#${v}` : formatNumberCompact(v)}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                className="text-xs"
                width={55}
              />
              {referenceValue && (
                <ReferenceLine
                  x={referenceValue}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 4"
                  label={{ value: '盟均', position: 'top', className: 'text-xs fill-muted-foreground' }}
                />
              )}
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  const groupData = groups.find(g => g.name === d.name)
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="font-medium">{d.name}</div>
                      <div className="text-sm">
                        {metric === 'rank' ? `平均排名: #${Math.round(d.value)}` : `${metric === 'contribution' ? '貢獻' : '戰功'}: ${formatNumber(d.value)}`}
                      </div>
                      {groupData && referenceValue && metric !== 'rank' && (
                        <div className={`text-xs ${d.value >= referenceValue ? 'text-primary' : 'text-destructive'}`}>
                          vs 盟均: {d.value >= referenceValue ? '+' : ''}{calculatePercentDiff(d.value, referenceValue).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  )
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((d, i) => (
                  <Cell
                    key={d.name}
                    fill={i < 2 ? 'var(--primary)' : i < 4 ? 'var(--chart-2)' : 'var(--muted)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">組別摘要</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium">組別</th>
                  <th className="text-right py-2 px-2 font-medium">人日均貢獻</th>
                  <th className="text-right py-2 px-2 font-medium">vs 盟均</th>
                  <th className="text-right py-2 px-2 font-medium">人日均戰功</th>
                  <th className="text-right py-2 px-2 font-medium">平均排名</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => {
                  const contribDiff = calculatePercentDiff(g.avg_daily_contribution, allianceAvg.avg_daily_contribution)
                  return (
                    <tr key={g.name} className="border-b last:border-0">
                      <td className="py-2 px-2 font-medium">{g.name}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{formatNumber(g.avg_daily_contribution)}</td>
                      <td className={`py-2 px-2 text-right tabular-nums ${contribDiff >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {contribDiff >= 0 ? '+' : ''}{contribDiff.toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">{formatNumber(g.avg_daily_merit)}</td>
                      <td className="py-2 px-2 text-right tabular-nums">#{Math.round(g.avg_rank)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Tab 3: Member Distribution
// ============================================================================

interface MemberDistributionTabProps {
  readonly viewMode: ViewMode
}

function MemberDistributionTab({ viewMode }: MemberDistributionTabProps) {
  const [showTop, setShowTop] = useState(true)

  const allianceAvg = viewMode === 'latest' ? LATEST_DATA : MOCK_SEASON_AVERAGES

  return (
    <div className="space-y-6">
      {/* Distribution Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contribution Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">貢獻分佈</CardTitle>
            <CardDescription>人日均貢獻區間分佈</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={distributionConfig} className="h-[240px] w-full">
              <BarChart data={MOCK_CONTRIBUTION_DISTRIBUTION} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="range" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{d.range}</div>
                        <div className="text-sm">{d.count} 人</div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
            <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
              平均: {formatNumber(allianceAvg.avg_daily_contribution)} / 中位數: {formatNumber(allianceAvg.median_daily_contribution)}
            </div>
          </CardContent>
        </Card>

        {/* Merit Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">戰功分佈</CardTitle>
            <CardDescription>人日均戰功區間分佈</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={distributionConfig} className="h-[240px] w-full">
              <BarChart data={MOCK_MERIT_DISTRIBUTION} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="range" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{d.range}</div>
                        <div className="text-sm">{d.count} 人</div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="count" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
            <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
              平均: {formatNumber(allianceAvg.avg_daily_merit)} / 中位數: {formatNumber(allianceAvg.median_daily_merit)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top/Bottom Performers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">成員排行</CardTitle>
              <CardDescription>本期表現 Top 10 / Bottom 5</CardDescription>
            </div>
            <Tabs value={showTop ? 'top' : 'bottom'} onValueChange={(v) => setShowTop(v === 'top')}>
              <TabsList className="h-8">
                <TabsTrigger value="top" className="text-xs px-3">Top 10</TabsTrigger>
                <TabsTrigger value="bottom" className="text-xs px-3">Bottom 5</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium">排名</th>
                  <th className="text-left py-2 px-2 font-medium">成員</th>
                  <th className="text-left py-2 px-2 font-medium">組別</th>
                  <th className="text-right py-2 px-2 font-medium">人日均貢獻</th>
                  <th className="text-right py-2 px-2 font-medium">人日均戰功</th>
                  <th className="text-right py-2 px-2 font-medium">排名變化</th>
                </tr>
              </thead>
              <tbody>
                {(showTop ? MOCK_TOP_PERFORMERS : MOCK_BOTTOM_PERFORMERS).map((m) => (
                  <tr key={m.name} className="border-b last:border-0">
                    <td className="py-2 px-2 tabular-nums font-medium">#{m.rank}</td>
                    <td className="py-2 px-2 font-medium">{m.name}</td>
                    <td className="py-2 px-2 text-muted-foreground">{m.group}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{formatNumber(m.daily_contribution)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{formatNumber(m.daily_merit)}</td>
                    <td className="py-2 px-2 text-right">
                      <RankChangeIndicator change={m.rank_change} showNewLabel={false} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Needs Attention */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            需關注成員
          </CardTitle>
          <CardDescription>排名大幅下滑或貢獻顯著低於中位數</CardDescription>
        </CardHeader>
        <CardContent>
          {MOCK_NEEDS_ATTENTION.length === 0 ? (
            <p className="text-sm text-muted-foreground">目前沒有需要特別關注的成員</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">成員</th>
                    <th className="text-left py-2 px-2 font-medium">組別</th>
                    <th className="text-right py-2 px-2 font-medium">當前排名</th>
                    <th className="text-right py-2 px-2 font-medium">排名變化</th>
                    <th className="text-left py-2 px-2 font-medium">原因</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_NEEDS_ATTENTION.map((m) => (
                    <tr key={m.name} className="border-b last:border-0 bg-destructive/5">
                      <td className="py-2 px-2 font-medium">{m.name}</td>
                      <td className="py-2 px-2 text-muted-foreground">{m.group}</td>
                      <td className="py-2 px-2 text-right tabular-nums">#{m.rank}</td>
                      <td className="py-2 px-2 text-right">
                        <RankChangeIndicator change={m.rank_change} showNewLabel={false} />
                      </td>
                      <td className="py-2 px-2 text-destructive">{m.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

function AllianceAnalytics() {
  const [activeTab, setActiveTab] = useState('overview')
  const [viewMode, setViewMode] = useState<ViewMode>('latest')

  return (
    <AllianceGuard>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">同盟分析</h2>
            <p className="text-muted-foreground mt-1">
              同盟整體表現分析與趨勢洞察
            </p>
          </div>

          {/* View Mode Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="latest" className="text-xs px-3">最新一期</TabsTrigger>
              <TabsTrigger value="season" className="text-xs px-3">賽季以來</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span>總覽</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <GitCompare className="h-4 w-4" />
              <span>組別對比</span>
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>成員分佈</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab viewMode={viewMode} />
          </TabsContent>

          <TabsContent value="groups">
            <GroupComparisonTab viewMode={viewMode} />
          </TabsContent>

          <TabsContent value="distribution">
            <MemberDistributionTab viewMode={viewMode} />
          </TabsContent>
        </Tabs>
      </div>
    </AllianceGuard>
  )
}

export default AllianceAnalytics
