/**
 * AllianceAnalytics - Alliance Performance Analytics Dashboard
 *
 * Alliance-level performance analysis with tab-based navigation:
 * 1. Overview: Alliance status snapshot with trends
 * 2. Group Comparison: Cross-group performance comparison
 * 3. Contribution Distribution: Performance distribution analysis
 * 4. Leaderboard: Top/bottom performers identification
 * 5. Power & Donation: Power and donation trends
 *
 * This version uses MOCK DATA for UI preview.
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AllianceGuard } from '@/components/alliance/AllianceGuard'
import { RankChangeIndicator } from '@/components/analytics/RankChangeIndicator'
import {
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  Users,
  GitCompare,
  BarChart3,
  Trophy,
  Zap,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Cell,
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
// MOCK DATA
// ============================================================================

// Mock period data (5 periods)
const MOCK_PERIODS = [
  { period_number: 1, period_label: '11/01-11/07', start_date: '2024-11-01', end_date: '2024-11-07', days: 7 },
  { period_number: 2, period_label: '11/08-11/14', start_date: '2024-11-07', end_date: '2024-11-14', days: 7 },
  { period_number: 3, period_label: '11/15-11/21', start_date: '2024-11-14', end_date: '2024-11-21', days: 7 },
  { period_number: 4, period_label: '11/22-11/28', start_date: '2024-11-21', end_date: '2024-11-28', days: 7 },
  { period_number: 5, period_label: '11/29-12/05', start_date: '2024-11-28', end_date: '2024-12-05', days: 7 },
]

// Mock alliance trend data
const MOCK_ALLIANCE_TREND = MOCK_PERIODS.map((p, i) => ({
  ...p,
  avgDailyMerit: 85000 + i * 3500,
  medianDailyMerit: 78000 + i * 3000,
  avgDailyDonation: 12000 + i * 800,
  avgPower: 2850000 + i * 120000,
  memberCount: 105,
  totalMerit: (85000 + i * 3500) * 105 * p.days,
}))

// Mock top contributors
const MOCK_TOP_CONTRIBUTORS = [
  { name: '張飛', group: '先鋒營', dailyMerit: 245000, rank: 1, rankChange: 0 },
  { name: '關羽', group: '先鋒營', dailyMerit: 232000, rank: 2, rankChange: 1 },
  { name: '趙雲', group: '先鋒營', dailyMerit: 218000, rank: 3, rankChange: -1 },
  { name: '馬超', group: '騎兵隊', dailyMerit: 205000, rank: 4, rankChange: 2 },
  { name: '黃忠', group: '弓箭隊', dailyMerit: 198000, rank: 5, rankChange: 0 },
  { name: '魏延', group: '先鋒營', dailyMerit: 185000, rank: 6, rankChange: -2 },
  { name: '姜維', group: '謀士團', dailyMerit: 178000, rank: 7, rankChange: 3 },
  { name: '諸葛亮', group: '謀士團', dailyMerit: 172000, rank: 8, rankChange: 1 },
  { name: '龐統', group: '謀士團', dailyMerit: 165000, rank: 9, rankChange: -1 },
  { name: '法正', group: '謀士團', dailyMerit: 158000, rank: 10, rankChange: 0 },
]

// Mock group data
const MOCK_GROUPS = [
  { name: '先鋒營', memberCount: 25, avgDailyMerit: 125000, avgRank: 28, avgPower: 3850000, avgDonation: 18500, meritMin: 45000, meritQ1: 85000, meritMedian: 120000, meritQ3: 165000, meritMax: 245000 },
  { name: '騎兵隊', memberCount: 20, avgDailyMerit: 98000, avgRank: 45, avgPower: 3200000, avgDonation: 14200, meritMin: 35000, meritQ1: 68000, meritMedian: 95000, meritQ3: 128000, meritMax: 205000 },
  { name: '謀士團', memberCount: 18, avgDailyMerit: 92000, avgRank: 52, avgPower: 2980000, avgDonation: 15800, meritMin: 42000, meritQ1: 72000, meritMedian: 88000, meritQ3: 115000, meritMax: 178000 },
  { name: '弓箭隊', memberCount: 15, avgDailyMerit: 85000, avgRank: 58, avgPower: 2750000, avgDonation: 12500, meritMin: 38000, meritQ1: 62000, meritMedian: 82000, meritQ3: 108000, meritMax: 198000 },
  { name: '後勤組', memberCount: 12, avgDailyMerit: 62000, avgRank: 78, avgPower: 2150000, avgDonation: 8500, meritMin: 25000, meritQ1: 45000, meritMedian: 58000, meritQ3: 78000, meritMax: 95000 },
  { name: '新兵營', memberCount: 15, avgDailyMerit: 45000, avgRank: 88, avgPower: 1450000, avgDonation: 5200, meritMin: 15000, meritQ1: 28000, meritMedian: 42000, meritQ3: 58000, meritMax: 82000 },
]

// Mock group trends
const MOCK_GROUP_TRENDS = MOCK_GROUPS.slice(0, 4).map(g => ({
  group: g.name,
  data: MOCK_PERIODS.map((p, i) => ({
    ...p,
    avgMerit: g.avgDailyMerit * (0.85 + i * 0.04),
  })),
}))

// Mock contribution distribution
const MOCK_DISTRIBUTION_BINS = [
  { rangeStart: 0, rangeEnd: 30000, count: 8, percentage: 7.6 },
  { rangeStart: 30000, rangeEnd: 60000, count: 22, percentage: 21.0 },
  { rangeStart: 60000, rangeEnd: 90000, count: 35, percentage: 33.3 },
  { rangeStart: 90000, rangeEnd: 120000, count: 20, percentage: 19.0 },
  { rangeStart: 120000, rangeEnd: 150000, count: 12, percentage: 11.4 },
  { rangeStart: 150000, rangeEnd: 180000, count: 5, percentage: 4.8 },
  { rangeStart: 180000, rangeEnd: 250000, count: 3, percentage: 2.9 },
]

// Mock tier distribution
const MOCK_TIER_CURRENT = { top20: { count: 21, pct: 20, avgMerit: 185000 }, mid60: { count: 63, pct: 60, avgMerit: 82000 }, bot20: { count: 21, pct: 20, avgMerit: 35000 } }

// Mock rank change distribution
const MOCK_RANK_CHANGES = [
  { range: '+10↑', count: 5, color: 'var(--primary)' },
  { range: '+5~9', count: 12, color: 'var(--primary)' },
  { range: '+1~4', count: 25, color: 'var(--chart-2)' },
  { range: '0', count: 18, color: 'var(--muted)' },
  { range: '-1~4', count: 22, color: 'var(--chart-3)' },
  { range: '-5~9', count: 15, color: 'var(--destructive)' },
  { range: '-10↓', count: 8, color: 'var(--destructive)' },
]

// Mock leaderboard data
const MOCK_MOST_IMPROVED = [
  { name: '姜維', group: '謀士團', prevRank: 25, currRank: 7, change: 18 },
  { name: '王平', group: '後勤組', prevRank: 68, currRank: 52, change: 16 },
  { name: '張嶷', group: '弓箭隊', prevRank: 45, currRank: 32, change: 13 },
  { name: '馬岱', group: '騎兵隊', prevRank: 55, currRank: 43, change: 12 },
  { name: '廖化', group: '先鋒營', prevRank: 38, currRank: 28, change: 10 },
]

const MOCK_NEEDS_ATTENTION = [
  { name: '李嚴', group: '後勤組', prevRank: 42, currRank: 58, change: -16 },
  { name: '孟達', group: '新兵營', prevRank: 65, currRank: 78, change: -13 },
  { name: '糜芳', group: '後勤組', prevRank: 72, currRank: 84, change: -12 },
  { name: '傅僉', group: '弓箭隊', prevRank: 48, currRank: 58, change: -10 },
  { name: '馬謖', group: '謀士團', prevRank: 35, currRank: 44, change: -9 },
]

// Mock power distribution
const MOCK_POWER_DISTRIBUTION = [
  { range: '<1M', count: 5, percentage: 4.8 },
  { range: '1-2M', count: 18, percentage: 17.1 },
  { range: '2-3M', count: 32, percentage: 30.5 },
  { range: '3-4M', count: 28, percentage: 26.7 },
  { range: '4-5M', count: 15, percentage: 14.3 },
  { range: '>5M', count: 7, percentage: 6.7 },
]

// Calculated constants
const ALLIANCE_AVG_MERIT = 85000
const ALLIANCE_MEDIAN_MERIT = 78000
const TOTAL_MEMBERS = 105
const CURRENT_PERIOD = MOCK_PERIODS[MOCK_PERIODS.length - 1]

// ============================================================================
// Chart Configurations
// ============================================================================

const trendChartConfig = {
  avgMerit: { label: '人日均戰功', color: 'var(--primary)' },
  medianMerit: { label: '中位數', color: 'var(--muted-foreground)' },
} satisfies ChartConfig

const groupBarConfig = {
  merit: { label: '人日均戰功', color: 'var(--primary)' },
} satisfies ChartConfig

const distributionConfig = {
  count: { label: '人數', color: 'var(--primary)' },
} satisfies ChartConfig

const powerDonationConfig = {
  power: { label: '平均勢力值', color: 'var(--primary)' },
  donation: { label: '人日均捐獻', color: 'var(--chart-2)' },
} satisfies ChartConfig

// ============================================================================
// Helper Components
// ============================================================================

interface KpiCardProps {
  readonly title: string
  readonly value: string | number
  readonly subtitle?: string
  readonly trend?: { value: number; label: string; isPositiveGood?: boolean }
  readonly icon?: React.ReactNode
  readonly highlight?: boolean
}

function KpiCard({ title, value, subtitle, trend, icon, highlight }: KpiCardProps) {
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
        <CardDescription className="flex items-center gap-2">
          {icon}
          {title}
        </CardDescription>
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
              {trend.value}
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

function OverviewTab() {
  // Expand periods to daily data for trend chart
  const dailyTrendData = useMemo(
    () =>
      expandPeriodsToDaily(MOCK_ALLIANCE_TREND, (p) => ({
        avgMerit: p.avgDailyMerit,
        medianMerit: p.medianDailyMerit,
        memberCount: p.memberCount,
      })),
    []
  )
  const xAxisTicks = useMemo(() => getPeriodBoundaryTicks(MOCK_ALLIANCE_TREND), [])

  // Calculate period-over-period changes
  const latestTrend = MOCK_ALLIANCE_TREND[MOCK_ALLIANCE_TREND.length - 1]
  const prevTrend = MOCK_ALLIANCE_TREND[MOCK_ALLIANCE_TREND.length - 2]
  const meritChange = ((latestTrend.avgDailyMerit - prevTrend.avgDailyMerit) / prevTrend.avgDailyMerit) * 100
  const powerChange = ((latestTrend.avgPower - prevTrend.avgPower) / prevTrend.avgPower) * 100

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="活躍成員"
          value={latestTrend.memberCount}
          icon={<Users className="h-3.5 w-3.5" />}
          subtitle="本期"
          highlight
        />
        <KpiCard
          title="人日均戰功"
          value={formatNumber(latestTrend.avgDailyMerit)}
          trend={{ value: Number(meritChange.toFixed(1)), label: '%' }}
          highlight
        />
        <KpiCard
          title="本期總戰功"
          value={formatNumber(latestTrend.totalMerit)}
          subtitle={CURRENT_PERIOD.period_label}
        />
        <KpiCard
          title="平均勢力值"
          value={formatNumber(latestTrend.avgPower)}
          trend={{ value: Number(powerChange.toFixed(1)), label: '%' }}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alliance Merit Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">同盟戰功趨勢</CardTitle>
            <CardDescription>人日均戰功與中位數變化</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendChartConfig} className="h-[280px] w-full">
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
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{data.dateLabel}</div>
                        <div className="text-sm">人日均: {formatNumber(data.avgMerit)}</div>
                        <div className="text-sm text-muted-foreground">
                          中位數: {formatNumber(data.medianMerit)}
                        </div>
                      </div>
                    )
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="stepAfter"
                  dataKey="avgMerit"
                  name="人日均戰功"
                  stroke="var(--primary)"
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
          </CardContent>
        </Card>

        {/* Top 10 Contributors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">戰功 Top 10</CardTitle>
            <CardDescription>本期日均戰功排行</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={groupBarConfig} className="h-[280px] w-full">
              <BarChart
                data={MOCK_TOP_CONTRIBUTORS}
                layout="vertical"
                margin={{ left: 60, right: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(v) => formatNumberCompact(v)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  width={55}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">#{data.rank} {data.name}</div>
                        <div className="text-sm">{data.group}</div>
                        <div className="text-sm">日均戰功: {formatNumber(data.dailyMerit)}</div>
                        <div className="text-xs text-muted-foreground">
                          排名變化: {data.rankChange >= 0 ? '+' : ''}{data.rankChange}
                        </div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="dailyMerit" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Group Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">組別表現概覽</CardTitle>
          <CardDescription>各組人日均戰功比較</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={groupBarConfig} className="h-[280px] w-full">
            <BarChart
              data={MOCK_GROUPS}
              layout="vertical"
              margin={{ left: 60, right: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                className="text-xs"
                tickFormatter={(v) => formatNumberCompact(v)}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                className="text-xs"
                width={55}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="font-medium">{data.name}</div>
                      <div className="text-sm">人日均: {formatNumber(data.avgDailyMerit)}</div>
                      <div className="text-sm text-muted-foreground">平均排名: #{data.avgRank}</div>
                      <div className="text-xs text-muted-foreground">{data.memberCount} 人</div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="avgDailyMerit" radius={[0, 4, 4, 0]}>
                {MOCK_GROUPS.map((g, i) => (
                  <Cell key={g.name} fill={i < 2 ? 'var(--primary)' : i < 4 ? 'var(--chart-2)' : 'var(--muted)'} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Tab 2: Group Comparison
// ============================================================================

function GroupComparisonTab() {
  // Expand group trends to daily
  const groupTrendDaily = useMemo(() => {
    const result: Record<string, { date: string; dateLabel: string; periodNumber: number; avgMerit: number }[]> = {}
    for (const gt of MOCK_GROUP_TRENDS) {
      result[gt.group] = expandPeriodsToDaily(gt.data, (p) => ({ avgMerit: p.avgMerit }))
    }
    return result
  }, [])

  // Prepare multi-line data
  const multiLineData = useMemo(() => {
    if (MOCK_GROUP_TRENDS.length === 0) return []
    const firstGroup = MOCK_GROUP_TRENDS[0]
    const daily = expandPeriodsToDaily(firstGroup.data, () => ({}))

    return daily.map((d, i) => {
      const point: Record<string, string | number> = { date: d.date, dateLabel: d.dateLabel, periodNumber: d.periodNumber }
      for (const gt of MOCK_GROUP_TRENDS) {
        const groupDaily = groupTrendDaily[gt.group]
        if (groupDaily && groupDaily[i]) {
          point[gt.group] = groupDaily[i].avgMerit
        }
      }
      return point
    })
  }, [groupTrendDaily])

  const xAxisTicks = useMemo(() => getPeriodBoundaryTicks(MOCK_GROUP_TRENDS[0]?.data ?? []), [])

  const groupColors = ['var(--primary)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)']

  return (
    <div className="space-y-6">
      {/* Group Box Plot */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">組別戰功分佈對比</CardTitle>
          <CardDescription>各組戰功分佈箱型圖（Min / Q1 / Median / Q3 / Max）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_GROUPS.map((g) => {
              const range = g.meritMax - g.meritMin
              const q1Pct = ((g.meritQ1 - g.meritMin) / range) * 100
              const medianPct = ((g.meritMedian - g.meritMin) / range) * 100
              const q3Pct = ((g.meritQ3 - g.meritMin) / range) * 100

              return (
                <div key={g.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{g.name}</span>
                    <span className="text-muted-foreground">{g.memberCount} 人</span>
                  </div>
                  <div className="relative h-6">
                    {/* Background bar */}
                    <div className="absolute inset-y-1.5 left-0 right-0 bg-muted rounded" />
                    {/* IQR box */}
                    <div
                      className="absolute inset-y-0.5 bg-primary/30 border-2 border-primary rounded"
                      style={{ left: `${q1Pct}%`, right: `${100 - q3Pct}%` }}
                    />
                    {/* Median line */}
                    <div
                      className="absolute inset-y-0 w-0.5 bg-primary"
                      style={{ left: `${medianPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatNumberCompact(g.meritMin)}</span>
                    <span>Q1: {formatNumberCompact(g.meritQ1)}</span>
                    <span>Med: {formatNumberCompact(g.meritMedian)}</span>
                    <span>Q3: {formatNumberCompact(g.meritQ3)}</span>
                    <span>{formatNumberCompact(g.meritMax)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Group Average Rank */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">組別平均排名</CardTitle>
            <CardDescription>排名越小越好</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={groupBarConfig} className="h-[280px] w-full">
              <BarChart
                data={[...MOCK_GROUPS].sort((a, b) => a.avgRank - b.avgRank)}
                layout="vertical"
                margin={{ left: 60, right: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(v) => `#${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  width={55}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{data.name}</div>
                        <div className="text-sm">平均排名: #{Math.round(data.avgRank)}</div>
                        <div className="text-sm text-muted-foreground">{data.memberCount} 人</div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="avgRank" radius={[0, 4, 4, 0]}>
                  {[...MOCK_GROUPS].sort((a, b) => a.avgRank - b.avgRank).map((g, i) => (
                    <Cell key={g.name} fill={i < 2 ? 'var(--primary)' : i < 4 ? 'var(--chart-2)' : 'var(--muted)'} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Group Trend Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">組別趨勢對比</CardTitle>
            <CardDescription>各組人日均戰功趨勢</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={Object.fromEntries(MOCK_GROUP_TRENDS.map((g, i) => [g.group, { label: g.group, color: groupColors[i] }]))}
              className="h-[280px] w-full"
            >
              <LineChart data={multiLineData} margin={{ left: 12, right: 12 }}>
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
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium mb-1">{data.dateLabel}</div>
                        {MOCK_GROUP_TRENDS.map((g, i) => (
                          <div key={g.group} className="text-sm" style={{ color: groupColors[i] }}>
                            {g.group}: {formatNumber(data[g.group] || 0)}
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {MOCK_GROUP_TRENDS.map((g, i) => (
                  <Line
                    key={g.group}
                    type="stepAfter"
                    dataKey={g.group}
                    stroke={groupColors[i]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">組別對比摘要</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium">組別</th>
                  <th className="text-right py-2 px-2 font-medium">人數</th>
                  <th className="text-right py-2 px-2 font-medium">人日均戰功</th>
                  <th className="text-right py-2 px-2 font-medium">vs 盟均</th>
                  <th className="text-right py-2 px-2 font-medium">平均排名</th>
                  <th className="text-right py-2 px-2 font-medium">排名範圍</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_GROUPS.map((g) => {
                  const diff = calculatePercentDiff(g.avgDailyMerit, ALLIANCE_AVG_MERIT)
                  const bestRank = Math.round(g.avgRank - (g.meritMax - g.meritMedian) / 5000)
                  const worstRank = Math.round(g.avgRank + (g.meritMedian - g.meritMin) / 5000)

                  return (
                    <tr key={g.name} className="border-b last:border-0">
                      <td className="py-2 px-2 font-medium">{g.name}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{g.memberCount}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{formatNumber(g.avgDailyMerit)}</td>
                      <td className={`py-2 px-2 text-right tabular-nums ${diff >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">#{Math.round(g.avgRank)}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-muted-foreground">
                        #{Math.max(1, bestRank)} - #{Math.min(TOTAL_MEMBERS, worstRank)}
                      </td>
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
// Tab 3: Contribution Distribution
// ============================================================================

function ContributionDistributionTab() {
  // Tier bar data
  const tierData = [
    { tier: 'Top 20%', count: MOCK_TIER_CURRENT.top20.count, avgMerit: MOCK_TIER_CURRENT.top20.avgMerit },
    { tier: 'Mid 60%', count: MOCK_TIER_CURRENT.mid60.count, avgMerit: MOCK_TIER_CURRENT.mid60.avgMerit },
    { tier: 'Bot 20%', count: MOCK_TIER_CURRENT.bot20.count, avgMerit: MOCK_TIER_CURRENT.bot20.avgMerit },
  ]

  // Distribution histogram data
  const histogramData = MOCK_DISTRIBUTION_BINS.map(b => ({
    range: `${formatNumberCompact(b.rangeStart)}-${formatNumberCompact(b.rangeEnd)}`,
    count: b.count,
    percentage: b.percentage,
  }))

  // Pareto data (cumulative)
  const paretoData = useMemo(() => {
    const sorted = [...MOCK_TOP_CONTRIBUTORS].sort((a, b) => b.dailyMerit - a.dailyMerit)
    const total = sorted.reduce((sum, m) => sum + m.dailyMerit, 0)
    let cumulative = 0
    return sorted.map((m) => {
      cumulative += m.dailyMerit
      return {
        name: m.name,
        merit: m.dailyMerit,
        cumulativePct: (cumulative / total) * 100,
      }
    })
  }, [])

  // Calculate metrics
  const top10Share = paretoData[0]?.cumulativePct ?? 0
  const medianMeanRatio = ALLIANCE_MEDIAN_MERIT / ALLIANCE_AVG_MERIT

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="人日均戰功（平均）"
          value={formatNumber(ALLIANCE_AVG_MERIT)}
          highlight
        />
        <KpiCard
          title="中位數"
          value={formatNumber(ALLIANCE_MEDIAN_MERIT)}
          subtitle="50% 成員高於此值"
        />
        <KpiCard
          title="Top 10% 佔比"
          value={`${(top10Share * 1.5).toFixed(1)}%`}
          subtitle="總戰功貢獻"
        />
        <KpiCard
          title="中位數/平均 比"
          value={medianMeanRatio.toFixed(2)}
          subtitle={medianMeanRatio > 0.8 ? '分佈健康' : '右偏分佈'}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribution Histogram */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">全盟戰功分佈</CardTitle>
            <CardDescription>成員日均戰功區間分佈</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={distributionConfig} className="h-[280px] w-full">
              <BarChart data={histogramData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="range" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{data.range}</div>
                        <div className="text-sm">{data.count} 人 ({data.percentage.toFixed(1)}%)</div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">階層分佈</CardTitle>
            <CardDescription>Top 20% / Mid 60% / Bot 20%</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={distributionConfig} className="h-[200px] w-full">
              <BarChart data={tierData} margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="tier" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{data.tier}</div>
                        <div className="text-sm">{data.count} 人</div>
                        <div className="text-sm text-muted-foreground">
                          平均: {formatNumber(data.avgMerit)}
                        </div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  <Cell fill="var(--chart-2)" />
                  <Cell fill="var(--primary)" />
                  <Cell fill="var(--destructive)" />
                </Bar>
              </BarChart>
            </ChartContainer>

            {/* Tier Details */}
            <div className="mt-4 pt-4 border-t">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left py-1">階層</th>
                    <th className="text-right py-1">人數</th>
                    <th className="text-right py-1">平均戰功</th>
                  </tr>
                </thead>
                <tbody>
                  {tierData.map((t, i) => (
                    <tr
                      key={t.tier}
                      className={`border-t ${i === 0 ? 'bg-chart-2/10' : i === 2 ? 'bg-destructive/10' : ''}`}
                    >
                      <td className="py-2">{t.tier}</td>
                      <td className="text-right tabular-nums">{t.count}</td>
                      <td className="text-right tabular-nums">{formatNumber(t.avgMerit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pareto Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">帕雷托分析</CardTitle>
            <CardDescription>Top 10 成員累積貢獻佔比</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={distributionConfig} className="h-[280px] w-full">
              <BarChart data={paretoData} margin={{ left: 50, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(v) => formatNumberCompact(v)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{data.name}</div>
                        <div className="text-sm">戰功: {formatNumber(data.merit)}</div>
                        <div className="text-sm text-muted-foreground">
                          累計: {data.cumulativePct.toFixed(1)}%
                        </div>
                      </div>
                    )
                  }}
                />
                <Bar yAxisId="left" dataKey="merit" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulativePct"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Rank Change Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">排名變化分佈</CardTitle>
            <CardDescription>本期成員排名變動情況</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={distributionConfig} className="h-[280px] w-full">
              <BarChart data={MOCK_RANK_CHANGES} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="range" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">排名變化 {data.range}</div>
                        <div className="text-sm">{data.count} 人</div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {MOCK_RANK_CHANGES.map((d) => (
                    <Cell key={d.range} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================================
// Tab 4: Leaderboard
// ============================================================================

function LeaderboardTab() {
  const [selectedPeriod, setSelectedPeriod] = useState(CURRENT_PERIOD.period_label)

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">期間:</span>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOCK_PERIODS.map((p) => (
              <SelectItem key={p.period_number} value={p.period_label}>
                {p.period_label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leaderboard Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Merit Top 10 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              戰功排行
            </CardTitle>
            <CardDescription>本期日均戰功 Top 10</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">排名</th>
                    <th className="text-left py-2 px-2 font-medium">成員</th>
                    <th className="text-left py-2 px-2 font-medium">組別</th>
                    <th className="text-right py-2 px-2 font-medium">日均戰功</th>
                    <th className="text-right py-2 px-2 font-medium">變化</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TOP_CONTRIBUTORS.map((m) => (
                    <tr key={m.name} className="border-b last:border-0">
                      <td className="py-2 px-2 tabular-nums font-medium">#{m.rank}</td>
                      <td className="py-2 px-2 font-medium">{m.name}</td>
                      <td className="py-2 px-2 text-muted-foreground">{m.group}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{formatNumber(m.dailyMerit)}</td>
                      <td className="py-2 px-2 text-right">
                        <RankChangeIndicator change={m.rankChange} showNewLabel={false} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Assist Top 10 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">助攻排行</CardTitle>
            <CardDescription>本期日均助攻 Top 10</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">排名</th>
                    <th className="text-left py-2 px-2 font-medium">成員</th>
                    <th className="text-left py-2 px-2 font-medium">組別</th>
                    <th className="text-right py-2 px-2 font-medium">日均助攻</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TOP_CONTRIBUTORS.slice(0, 10).map((m, i) => (
                    <tr key={m.name} className="border-b last:border-0">
                      <td className="py-2 px-2 tabular-nums font-medium">#{i + 1}</td>
                      <td className="py-2 px-2 font-medium">{m.name}</td>
                      <td className="py-2 px-2 text-muted-foreground">{m.group}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{Math.round(m.dailyMerit * 0.15)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Improved & Needs Attention */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most Improved */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              進步最多
            </CardTitle>
            <CardDescription>本期排名提升幅度最大</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">成員</th>
                    <th className="text-left py-2 px-2 font-medium">組別</th>
                    <th className="text-right py-2 px-2 font-medium">排名變化</th>
                    <th className="text-right py-2 px-2 font-medium">當前</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_MOST_IMPROVED.map((m) => (
                    <tr key={m.name} className="border-b last:border-0 bg-primary/5">
                      <td className="py-2 px-2 font-medium">{m.name}</td>
                      <td className="py-2 px-2 text-muted-foreground">{m.group}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-primary">
                        +{m.change} ↑
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">#{m.currRank}</td>
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
              <TrendingDown className="h-4 w-4 text-destructive" />
              需關注
            </CardTitle>
            <CardDescription>本期排名下降幅度最大</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">成員</th>
                    <th className="text-left py-2 px-2 font-medium">組別</th>
                    <th className="text-right py-2 px-2 font-medium">排名變化</th>
                    <th className="text-right py-2 px-2 font-medium">當前</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_NEEDS_ATTENTION.map((m) => (
                    <tr key={m.name} className="border-b last:border-0 bg-destructive/5">
                      <td className="py-2 px-2 font-medium">{m.name}</td>
                      <td className="py-2 px-2 text-muted-foreground">{m.group}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-destructive">
                        {m.change} ↓
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">#{m.currRank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================================
// Tab 5: Power & Donation
// ============================================================================

function PowerDonationTab() {
  // Expand periods to daily data
  const dailyData = useMemo(
    () =>
      expandPeriodsToDaily(MOCK_ALLIANCE_TREND, (p) => ({
        avgPower: p.avgPower,
        avgDonation: p.avgDailyDonation,
      })),
    []
  )
  const xAxisTicks = useMemo(() => getPeriodBoundaryTicks(MOCK_ALLIANCE_TREND), [])

  // Calculate changes
  const latestTrend = MOCK_ALLIANCE_TREND[MOCK_ALLIANCE_TREND.length - 1]
  const prevTrend = MOCK_ALLIANCE_TREND[MOCK_ALLIANCE_TREND.length - 2]
  const powerChange = ((latestTrend.avgPower - prevTrend.avgPower) / prevTrend.avgPower) * 100
  const donationChange = ((latestTrend.avgDailyDonation - prevTrend.avgDailyDonation) / prevTrend.avgDailyDonation) * 100

  // Total donation
  const totalDonation = latestTrend.avgDailyDonation * TOTAL_MEMBERS * CURRENT_PERIOD.days

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="平均勢力值"
          value={formatNumber(latestTrend.avgPower)}
          icon={<Zap className="h-3.5 w-3.5" />}
          trend={{ value: Number(powerChange.toFixed(1)), label: '%' }}
          highlight
        />
        <KpiCard
          title="人日均捐獻"
          value={formatNumber(latestTrend.avgDailyDonation)}
          trend={{ value: Number(donationChange.toFixed(1)), label: '%' }}
          highlight
        />
        <KpiCard
          title="本期總捐獻"
          value={formatNumber(totalDonation)}
          subtitle={CURRENT_PERIOD.period_label}
        />
        <KpiCard
          title="勢力值中位數"
          value={formatNumber(latestTrend.avgPower * 0.92)}
          subtitle="估計值"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Power Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">勢力值趨勢</CardTitle>
            <CardDescription>同盟平均勢力值變化</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={powerDonationConfig} className="h-[280px] w-full">
              <AreaChart data={dailyData} margin={{ left: 12, right: 12 }}>
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
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{data.dateLabel}</div>
                        <div className="text-sm">平均勢力值: {formatNumber(data.avgPower)}</div>
                      </div>
                    )
                  }}
                />
                <Area
                  type="stepAfter"
                  dataKey="avgPower"
                  name="平均勢力值"
                  fill="var(--primary)"
                  fillOpacity={0.3}
                  stroke="var(--primary)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Donation Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">捐獻趨勢</CardTitle>
            <CardDescription>人日均捐獻變化</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={powerDonationConfig} className="h-[280px] w-full">
              <AreaChart data={dailyData} margin={{ left: 12, right: 12 }}>
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
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{data.dateLabel}</div>
                        <div className="text-sm">人日均捐獻: {formatNumber(data.avgDonation)}</div>
                      </div>
                    )
                  }}
                />
                <Area
                  type="stepAfter"
                  dataKey="avgDonation"
                  name="人日均捐獻"
                  fill="var(--chart-2)"
                  fillOpacity={0.3}
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Power Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">勢力值分佈</CardTitle>
            <CardDescription>成員勢力值區間分佈</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={distributionConfig} className="h-[280px] w-full">
              <BarChart data={MOCK_POWER_DISTRIBUTION} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="range" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{data.range}</div>
                        <div className="text-sm">{data.count} 人 ({data.percentage.toFixed(1)}%)</div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Group Power Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">組別勢力值對比</CardTitle>
            <CardDescription>各組平均勢力值</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={groupBarConfig} className="h-[280px] w-full">
              <BarChart
                data={[...MOCK_GROUPS].sort((a, b) => b.avgPower - a.avgPower)}
                layout="vertical"
                margin={{ left: 60, right: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(v) => formatNumberCompact(v)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  width={55}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{data.name}</div>
                        <div className="text-sm">平均勢力值: {formatNumber(data.avgPower)}</div>
                        <div className="text-sm text-muted-foreground">人日均捐獻: {formatNumber(data.avgDonation)}</div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="avgPower" radius={[0, 4, 4, 0]}>
                  {[...MOCK_GROUPS].sort((a, b) => b.avgPower - a.avgPower).map((g, i) => (
                    <Cell key={g.name} fill={i < 2 ? 'var(--primary)' : i < 4 ? 'var(--chart-2)' : 'var(--muted)'} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Period Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">期間明細</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium">期間</th>
                  <th className="text-right py-2 px-2 font-medium">平均勢力值</th>
                  <th className="text-right py-2 px-2 font-medium">勢力值變化</th>
                  <th className="text-right py-2 px-2 font-medium">人日均捐獻</th>
                  <th className="text-right py-2 px-2 font-medium">捐獻變化</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ALLIANCE_TREND.map((p, i) => {
                  const prevPower = i > 0 ? MOCK_ALLIANCE_TREND[i - 1].avgPower : null
                  const powerDiff = prevPower ? ((p.avgPower - prevPower) / prevPower) * 100 : null
                  const prevDonation = i > 0 ? MOCK_ALLIANCE_TREND[i - 1].avgDailyDonation : null
                  const donationDiff = prevDonation ? ((p.avgDailyDonation - prevDonation) / prevDonation) * 100 : null

                  return (
                    <tr key={p.period_number} className="border-b last:border-0">
                      <td className="py-2 px-2 text-muted-foreground">{p.period_label}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{formatNumber(p.avgPower)}</td>
                      <td className="py-2 px-2 text-right">
                        {powerDiff !== null ? (
                          <span className={powerDiff >= 0 ? 'text-primary' : 'text-destructive'}>
                            {powerDiff >= 0 ? '+' : ''}{powerDiff.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">{formatNumber(p.avgDailyDonation)}</td>
                      <td className="py-2 px-2 text-right">
                        {donationDiff !== null ? (
                          <span className={donationDiff >= 0 ? 'text-primary' : 'text-destructive'}>
                            {donationDiff >= 0 ? '+' : ''}{donationDiff.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
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
// Main Component
// ============================================================================

function AllianceAnalytics() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <AllianceGuard>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">同盟分析</h2>
          <p className="text-muted-foreground mt-1">
            同盟整體表現分析與趨勢洞察
          </p>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">總覽</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <GitCompare className="h-4 w-4" />
              <span className="hidden sm:inline">組別對比</span>
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">貢獻分佈</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">排行榜</span>
            </TabsTrigger>
            <TabsTrigger value="power" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">勢力與捐獻</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="groups">
            <GroupComparisonTab />
          </TabsContent>

          <TabsContent value="distribution">
            <ContributionDistributionTab />
          </TabsContent>

          <TabsContent value="leaderboard">
            <LeaderboardTab />
          </TabsContent>

          <TabsContent value="power">
            <PowerDonationTab />
          </TabsContent>
        </Tabs>
      </div>
    </AllianceGuard>
  )
}

export default AllianceAnalytics
