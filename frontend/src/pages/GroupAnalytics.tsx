/**
 * GroupAnalytics - Group Performance Analytics Page
 *
 * Group-level performance analysis based on calculable metrics:
 * - Group selector dropdown
 * - Tab-based navigation:
 *   1. Overview: Group summary stats + Capability Radar (4 dimensions)
 *   2. Merit Distribution: Box plot + Tier breakdown + Trends
 *   3. Contribution Rank: Rank distribution + Trends
 *   4. Member Rankings: Sortable member table within group
 *
 * Key concept: "Person-day average" (人日均) = daily_* metrics averaged across group members
 * This normalizes for both time and group size, enabling fair comparison.
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
  BarChart3,
  Trophy,
  Users,
} from 'lucide-react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Bar,
  BarChart,
  Line,
  LineChart,
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
// Types - Based on calculable metrics only
// ============================================================================

interface GroupOption {
  readonly id: string
  readonly name: string
  readonly memberCount: number
}

/**
 * Group statistics based on actual calculable data.
 * All metrics derived from member_period_metrics aggregation.
 */
interface GroupStats {
  readonly group_name: string
  readonly member_count: number

  // Person-day averages (core comparison metrics)
  readonly avg_daily_merit: number
  readonly avg_daily_assist: number
  readonly avg_daily_donation: number
  readonly avg_power: number

  // Rank statistics
  readonly avg_rank: number
  readonly best_rank: number // min rank (best performing member)
  readonly worst_rank: number // max rank (lowest performing member)

  // Merit distribution statistics (for box plot)
  readonly merit_min: number
  readonly merit_q1: number
  readonly merit_median: number
  readonly merit_q3: number
  readonly merit_max: number
  readonly merit_cv: number // Coefficient of variation = std / mean
}

interface TierBreakdown {
  readonly tier: string
  readonly count: number
  readonly percentage: number
  readonly avg_merit: number
}

interface GroupMember {
  readonly id: string
  readonly name: string
  readonly contribution_rank: number
  readonly daily_merit: number
  readonly daily_assist: number
  readonly daily_donation: number
  readonly power: number
  readonly rank_change: number | null
}

interface PeriodTrend {
  readonly period_label: string
  readonly period_number: number
  readonly start_date: string
  readonly end_date: string
  readonly avg_rank: number
  readonly avg_merit: number
  readonly avg_assist: number
  readonly member_count: number
}

// ============================================================================
// Mock Data - Realistic values based on actual metrics
// ============================================================================

const MOCK_GROUPS: readonly GroupOption[] = [
  { id: '1', name: '狼王特戰', memberCount: 28 },
  { id: '2', name: '墨組', memberCount: 25 },
  { id: '3', name: '隼隼組', memberCount: 24 },
  { id: '4', name: '紅隊', memberCount: 26 },
  { id: '5', name: '飛鳳營', memberCount: 23 },
  { id: '6', name: '虎賁軍', memberCount: 27 },
  { id: '7', name: '青龍隊', memberCount: 22 },
  { id: '8', name: '玄武組', memberCount: 24 },
]

// Alliance-wide averages for comparison baseline
const ALLIANCE_AVG = {
  avg_rank: 100,
  daily_merit: 12000,
  daily_assist: 85,
  daily_donation: 180000,
  power: 2500000,
}

const MOCK_GROUP_STATS: Record<string, GroupStats> = {
  '1': {
    group_name: '狼王特戰',
    member_count: 28,
    avg_daily_merit: 15200,
    avg_daily_assist: 98,
    avg_daily_donation: 195000,
    avg_power: 2850000,
    avg_rank: 42,
    best_rank: 3,
    worst_rank: 156,
    merit_min: 5200,
    merit_q1: 11000,
    merit_median: 14500,
    merit_q3: 18500,
    merit_max: 28000,
    merit_cv: 0.32,
  },
  '2': {
    group_name: '墨組',
    member_count: 25,
    avg_daily_merit: 13100,
    avg_daily_assist: 82,
    avg_daily_donation: 175000,
    avg_power: 2650000,
    avg_rank: 58,
    best_rank: 8,
    worst_rank: 142,
    merit_min: 4800,
    merit_q1: 9500,
    merit_median: 12800,
    merit_q3: 16200,
    merit_max: 24000,
    merit_cv: 0.28,
  },
  '3': {
    group_name: '隼隼組',
    member_count: 24,
    avg_daily_merit: 12400,
    avg_daily_assist: 78,
    avg_daily_donation: 168000,
    avg_power: 2450000,
    avg_rank: 65,
    best_rank: 12,
    worst_rank: 168,
    merit_min: 4200,
    merit_q1: 8800,
    merit_median: 11800,
    merit_q3: 15200,
    merit_max: 22500,
    merit_cv: 0.35,
  },
}

// Generate default stats for groups without specific data
function getGroupStats(groupId: string): GroupStats {
  if (MOCK_GROUP_STATS[groupId]) {
    return MOCK_GROUP_STATS[groupId]
  }
  const group = MOCK_GROUPS.find((g) => g.id === groupId)
  return {
    group_name: group?.name ?? '未知組別',
    member_count: group?.memberCount ?? 20,
    avg_daily_merit: 10000 + Math.floor(Math.random() * 3000),
    avg_daily_assist: 70 + Math.floor(Math.random() * 20),
    avg_daily_donation: 160000 + Math.floor(Math.random() * 30000),
    avg_power: 2200000 + Math.floor(Math.random() * 400000),
    avg_rank: 80 + Math.floor(Math.random() * 40),
    best_rank: 15 + Math.floor(Math.random() * 20),
    worst_rank: 150 + Math.floor(Math.random() * 40),
    merit_min: 4000,
    merit_q1: 8000,
    merit_median: 11000,
    merit_q3: 14000,
    merit_max: 20000,
    merit_cv: 0.30,
  }
}

// Tier breakdown: based on within-group relative position
function generateTierBreakdown(stats: GroupStats): TierBreakdown[] {
  const count = stats.member_count
  const topCount = Math.round(count * 0.2)
  const botCount = Math.round(count * 0.2)
  const midCount = count - topCount - botCount

  return [
    {
      tier: 'Top 20%',
      count: topCount,
      percentage: Math.round((topCount / count) * 100),
      avg_merit: Math.round(stats.merit_q3 + (stats.merit_max - stats.merit_q3) * 0.5),
    },
    {
      tier: 'Mid 60%',
      count: midCount,
      percentage: Math.round((midCount / count) * 100),
      avg_merit: stats.merit_median,
    },
    {
      tier: 'Bot 20%',
      count: botCount,
      percentage: Math.round((botCount / count) * 100),
      avg_merit: Math.round(stats.merit_q1 - (stats.merit_q1 - stats.merit_min) * 0.3),
    },
  ]
}

// Period trends mock data
const MOCK_PERIOD_TRENDS: Record<string, PeriodTrend[]> = {
  '1': [
    { period_label: '10/02-09', period_number: 1, start_date: '2024-10-02', end_date: '2024-10-09', avg_rank: 48, avg_merit: 14200, avg_assist: 92, member_count: 28 },
    { period_label: '10/09-16', period_number: 2, start_date: '2024-10-09', end_date: '2024-10-16', avg_rank: 45, avg_merit: 14600, avg_assist: 95, member_count: 28 },
    { period_label: '10/16-23', period_number: 3, start_date: '2024-10-16', end_date: '2024-10-23', avg_rank: 43, avg_merit: 14900, avg_assist: 96, member_count: 28 },
    { period_label: '10/23-30', period_number: 4, start_date: '2024-10-23', end_date: '2024-10-30', avg_rank: 42, avg_merit: 15200, avg_assist: 98, member_count: 28 },
  ],
  '2': [
    { period_label: '10/02-09', period_number: 1, start_date: '2024-10-02', end_date: '2024-10-09', avg_rank: 62, avg_merit: 12200, avg_assist: 78, member_count: 25 },
    { period_label: '10/09-16', period_number: 2, start_date: '2024-10-09', end_date: '2024-10-16', avg_rank: 60, avg_merit: 12600, avg_assist: 80, member_count: 25 },
    { period_label: '10/16-23', period_number: 3, start_date: '2024-10-16', end_date: '2024-10-23', avg_rank: 59, avg_merit: 12850, avg_assist: 81, member_count: 25 },
    { period_label: '10/23-30', period_number: 4, start_date: '2024-10-23', end_date: '2024-10-30', avg_rank: 58, avg_merit: 13100, avg_assist: 82, member_count: 25 },
  ],
  '3': [
    { period_label: '10/02-09', period_number: 1, start_date: '2024-10-02', end_date: '2024-10-09', avg_rank: 72, avg_merit: 11500, avg_assist: 72, member_count: 24 },
    { period_label: '10/09-16', period_number: 2, start_date: '2024-10-09', end_date: '2024-10-16', avg_rank: 69, avg_merit: 11900, avg_assist: 74, member_count: 24 },
    { period_label: '10/16-23', period_number: 3, start_date: '2024-10-16', end_date: '2024-10-23', avg_rank: 67, avg_merit: 12150, avg_assist: 76, member_count: 24 },
    { period_label: '10/23-30', period_number: 4, start_date: '2024-10-23', end_date: '2024-10-30', avg_rank: 65, avg_merit: 12400, avg_assist: 78, member_count: 24 },
  ],
}

function getPeriodTrends(groupId: string): PeriodTrend[] {
  return MOCK_PERIOD_TRENDS[groupId] ?? MOCK_PERIOD_TRENDS['1']
}

// Group members mock data
const MOCK_GROUP_MEMBERS: Record<string, GroupMember[]> = {
  '1': [
    { id: '1', name: '大地英豪', contribution_rank: 3, daily_merit: 28000, daily_assist: 145, daily_donation: 320000, power: 4200000, rank_change: 2 },
    { id: '2', name: '委皇叔', contribution_rank: 5, daily_merit: 25500, daily_assist: 132, daily_donation: 295000, power: 3950000, rank_change: 1 },
    { id: '3', name: '小沐沐', contribution_rank: 8, daily_merit: 24200, daily_assist: 128, daily_donation: 280000, power: 3800000, rank_change: null },
    { id: '4', name: '胖丨噴泡包', contribution_rank: 12, daily_merit: 22100, daily_assist: 118, daily_donation: 265000, power: 3650000, rank_change: -1 },
    { id: '5', name: '胖丨冬甩', contribution_rank: 18, daily_merit: 19800, daily_assist: 108, daily_donation: 245000, power: 3400000, rank_change: 3 },
    { id: '6', name: '桃丨筍', contribution_rank: 22, daily_merit: 18200, daily_assist: 102, daily_donation: 228000, power: 3200000, rank_change: 0 },
    { id: '7', name: '黑衫子龍', contribution_rank: 35, daily_merit: 15100, daily_assist: 95, daily_donation: 205000, power: 2900000, rank_change: 2 },
    { id: '8', name: '喜馬拉雅星', contribution_rank: 48, daily_merit: 13800, daily_assist: 88, daily_donation: 188000, power: 2650000, rank_change: -2 },
    { id: '9', name: '戰神阿瑞斯', contribution_rank: 62, daily_merit: 11500, daily_assist: 82, daily_donation: 172000, power: 2400000, rank_change: 1 },
    { id: '10', name: '夜行者', contribution_rank: 78, daily_merit: 9200, daily_assist: 75, daily_donation: 155000, power: 2150000, rank_change: -3 },
    { id: '11', name: '風行者', contribution_rank: 125, daily_merit: 6500, daily_assist: 42, daily_donation: 125000, power: 1800000, rank_change: -5 },
    { id: '12', name: '新手小將', contribution_rank: 156, daily_merit: 5200, daily_assist: 35, daily_donation: 98000, power: 1450000, rank_change: null },
  ],
  '2': [
    { id: '13', name: '墨染天涯', contribution_rank: 8, daily_merit: 24000, daily_assist: 120, daily_donation: 275000, power: 3750000, rank_change: 1 },
    { id: '14', name: '墨舞', contribution_rank: 15, daily_merit: 21500, daily_assist: 112, daily_donation: 258000, power: 3550000, rank_change: 2 },
    { id: '15', name: '墨客', contribution_rank: 52, daily_merit: 12800, daily_assist: 85, daily_donation: 178000, power: 2550000, rank_change: 0 },
    { id: '16', name: '墨魂', contribution_rank: 75, daily_merit: 10500, daily_assist: 78, daily_donation: 162000, power: 2280000, rank_change: -1 },
    { id: '17', name: '墨香', contribution_rank: 142, daily_merit: 6200, daily_assist: 38, daily_donation: 112000, power: 1680000, rank_change: -3 },
  ],
  '3': [
    { id: '18', name: '隼鷹', contribution_rank: 12, daily_merit: 22500, daily_assist: 115, daily_donation: 262000, power: 3620000, rank_change: 3 },
    { id: '19', name: '隼風', contribution_rank: 20, daily_merit: 19800, daily_assist: 105, daily_donation: 242000, power: 3380000, rank_change: 1 },
    { id: '20', name: '隼翔', contribution_rank: 68, daily_merit: 10000, daily_assist: 72, daily_donation: 158000, power: 2350000, rank_change: -2 },
    { id: '21', name: '隼飛', contribution_rank: 85, daily_merit: 8200, daily_assist: 65, daily_donation: 145000, power: 2080000, rank_change: 0 },
    { id: '22', name: '隼羽', contribution_rank: 168, daily_merit: 4200, daily_assist: 28, daily_donation: 85000, power: 1320000, rank_change: -4 },
  ],
}

function getGroupMembers(groupId: string): GroupMember[] {
  return MOCK_GROUP_MEMBERS[groupId] ?? MOCK_GROUP_MEMBERS['1']
}

// All groups comparison data (sorted by merit)
function getAllGroupsComparison(): Array<{ name: string; merit: number; avgRank: number; memberCount: number }> {
  return MOCK_GROUPS.map((group) => {
    const stats = getGroupStats(group.id)
    return {
      name: group.name,
      merit: stats.avg_daily_merit,
      avgRank: stats.avg_rank,
      memberCount: stats.member_count,
    }
  }).sort((a, b) => b.merit - a.merit)
}

// ============================================================================
// Chart Configurations
// ============================================================================

const capabilityRadarConfig = {
  group: {
    label: '組別',
    color: 'var(--primary)',
  },
  alliance: {
    label: '同盟平均',
    color: 'var(--muted-foreground)',
  },
} satisfies ChartConfig

const meritBarConfig = {
  merit: {
    label: '人日均戰功',
    color: 'var(--primary)',
  },
} satisfies ChartConfig

const tierBarConfig = {
  count: {
    label: '人數',
    color: 'var(--primary)',
  },
} satisfies ChartConfig

const meritTrendConfig = {
  merit: {
    label: '人日均戰功',
    color: 'var(--primary)',
  },
  assist: {
    label: '人日均助攻',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

const rankTrendConfig = {
  rank: {
    label: '平均排名',
    color: 'var(--primary)',
  },
} satisfies ChartConfig

const rankDistributionConfig = {
  count: {
    label: '人數',
    color: 'var(--primary)',
  },
} satisfies ChartConfig

// ============================================================================
// Tier colors (consistent with MemberPerformance)
// ============================================================================

const TIER_COLORS = {
  top: 'var(--chart-2)',
  mid: 'var(--primary)',
  bottom: 'var(--destructive)',
} as const

function getTierBgClass(tierIndex: number): string {
  if (tierIndex === 0) return 'bg-chart-2/10' // Top
  if (tierIndex === 2) return 'bg-destructive/10' // Bottom
  return '' // Mid
}

function getMemberTier(member: GroupMember, members: GroupMember[]): 'top' | 'mid' | 'bottom' {
  const sorted = [...members].sort((a, b) => b.daily_merit - a.daily_merit)
  const index = sorted.findIndex((m) => m.id === member.id)
  const topThreshold = Math.floor(members.length * 0.2)
  const bottomThreshold = Math.floor(members.length * 0.8)

  if (index < topThreshold) return 'top'
  if (index >= bottomThreshold) return 'bottom'
  return 'mid'
}

function getTierBgColor(tier: 'top' | 'mid' | 'bottom'): string {
  switch (tier) {
    case 'top':
      return 'bg-primary/10'
    case 'bottom':
      return 'bg-destructive/10'
    default:
      return ''
  }
}

// ============================================================================
// Tab 1: Overview
// ============================================================================

interface OverviewTabProps {
  readonly groupStats: GroupStats
  readonly allGroupsData: ReturnType<typeof getAllGroupsComparison>
}

function OverviewTab({ groupStats, allGroupsData }: OverviewTabProps) {
  // Capability radar data: normalized to alliance average (100 = alliance average)
  const radarData = useMemo(() => {
    const normalize = (value: number, avg: number) => (avg > 0 ? Math.round((value / avg) * 100) : 0)

    return [
      {
        metric: '戰功',
        group: normalize(groupStats.avg_daily_merit, ALLIANCE_AVG.daily_merit),
        groupRaw: groupStats.avg_daily_merit,
        alliance: 100,
        allianceRaw: ALLIANCE_AVG.daily_merit,
      },
      {
        metric: '助攻',
        group: normalize(groupStats.avg_daily_assist, ALLIANCE_AVG.daily_assist),
        groupRaw: groupStats.avg_daily_assist,
        alliance: 100,
        allianceRaw: ALLIANCE_AVG.daily_assist,
      },
      {
        metric: '捐獻',
        group: normalize(groupStats.avg_daily_donation, ALLIANCE_AVG.daily_donation),
        groupRaw: groupStats.avg_daily_donation,
        alliance: 100,
        allianceRaw: ALLIANCE_AVG.daily_donation,
      },
      {
        metric: '勢力值',
        group: normalize(groupStats.avg_power, ALLIANCE_AVG.power),
        groupRaw: groupStats.avg_power,
        alliance: 100,
        allianceRaw: ALLIANCE_AVG.power,
      },
    ]
  }, [groupStats])

  const meritDiff = calculatePercentDiff(groupStats.avg_daily_merit, ALLIANCE_AVG.daily_merit)
  const assistDiff = calculatePercentDiff(groupStats.avg_daily_assist, ALLIANCE_AVG.daily_assist)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Member Count */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>成員數</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{groupStats.member_count}</div>
            <p className="text-xs text-muted-foreground mt-1">活躍成員</p>
          </CardContent>
        </Card>

        {/* Average Rank */}
        <Card className="border-primary/50">
          <CardHeader className="pb-2">
            <CardDescription>組別平均排名</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              #{groupStats.avg_rank}
              <span className="text-base font-normal text-muted-foreground ml-1">/ 201</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              最佳 #{groupStats.best_rank} · 最差 #{groupStats.worst_rank}
            </p>
          </CardContent>
        </Card>

        {/* Daily Merit */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>人日均戰功</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatNumber(groupStats.avg_daily_merit)}</div>
            <div className="flex items-center gap-1 mt-1">
              {meritDiff >= 0 ? (
                <TrendingUp className="h-3 w-3 text-primary" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              <span className={`text-xs ${meritDiff >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {meritDiff >= 0 ? '+' : ''}
                {meritDiff.toFixed(1)}% vs 盟均
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Daily Assist */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>人日均助攻</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatNumber(groupStats.avg_daily_assist)}</div>
            <div className="flex items-center gap-1 mt-1">
              {assistDiff >= 0 ? (
                <TrendingUp className="h-3 w-3 text-primary" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              <span className={`text-xs ${assistDiff >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {assistDiff >= 0 ? '+' : ''}
                {assistDiff.toFixed(1)}% vs 盟均
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Capability Radar (4 dimensions) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">四維能力圖</CardTitle>
            <CardDescription>組別人日均表現 vs 同盟平均（100% = 同盟平均）</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={capabilityRadarConfig} className="mx-auto aspect-square max-h-[280px]">
              <RadarChart data={radarData}>
                <PolarGrid gridType="polygon" />
                <PolarAngleAxis dataKey="metric" className="text-xs" tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, Math.max(150, ...radarData.map((d) => d.group))]}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Radar
                  name="同盟平均"
                  dataKey="alliance"
                  stroke="var(--muted-foreground)"
                  fill="var(--muted-foreground)"
                  fillOpacity={0.15}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <Radar
                  name={groupStats.group_name}
                  dataKey="group"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload as (typeof radarData)[0]
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium mb-1">{data.metric}</div>
                        <div className="text-sm">
                          {groupStats.group_name}：{formatNumberCompact(data.groupRaw)} ({data.group}%)
                        </div>
                        <div className="text-sm text-muted-foreground">
                          同盟平均：{formatNumberCompact(data.allianceRaw)} ({data.alliance}%)
                        </div>
                      </div>
                    )
                  }}
                />
                <Legend />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* All Groups Comparison by Merit */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">全組別戰功比較</CardTitle>
            <CardDescription>人日均戰功排名</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={meritBarConfig} className="h-[280px] w-full">
              <BarChart data={allGroupsData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatNumberCompact(value)}
                  className="text-xs"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  width={75}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload as (typeof allGroupsData)[0]
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{data.name}</div>
                        <div className="text-sm">人日均戰功: {formatNumber(data.merit)}</div>
                        <div className="text-sm text-muted-foreground">平均排名: #{data.avgRank}</div>
                        <div className="text-sm text-muted-foreground">成員數: {data.memberCount}</div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="merit" radius={[0, 4, 4, 0]}>
                  {allGroupsData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.name === groupStats.group_name ? 'var(--primary)' : 'var(--muted)'}
                    />
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
// Tab 2: Merit Distribution
// ============================================================================

interface MeritDistributionTabProps {
  readonly groupStats: GroupStats
  readonly tierBreakdown: TierBreakdown[]
  readonly periodTrends: PeriodTrend[]
}

function MeritDistributionTab({ groupStats, tierBreakdown, periodTrends }: MeritDistributionTabProps) {
  // Expand periods to daily data for date-based X-axis
  const dailyData = useMemo(
    () =>
      expandPeriodsToDaily(periodTrends, (p) => ({
        avgRank: p.avg_rank,
        avgMerit: p.avg_merit,
        avgAssist: p.avg_assist,
      })),
    [periodTrends]
  )
  const xAxisTicks = useMemo(() => getPeriodBoundaryTicks(periodTrends), [periodTrends])

  // Calculate growth
  const meritGrowth =
    periodTrends.length >= 2
      ? ((periodTrends[periodTrends.length - 1].avg_merit - periodTrends[0].avg_merit) / periodTrends[0].avg_merit) * 100
      : 0

  // IQR
  const iqr = groupStats.merit_q3 - groupStats.merit_q1

  return (
    <div className="space-y-6">
      {/* Distribution Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/50">
          <CardHeader className="pb-2">
            <CardDescription>人日均戰功（平均）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatNumber(groupStats.avg_daily_merit)}</div>
            <div className="flex items-center gap-1 mt-1">
              {meritGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-primary" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              <span className={`text-xs ${meritGrowth >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {meritGrowth >= 0 ? '+' : ''}
                {meritGrowth.toFixed(1)}% 成長
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>中位數</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatNumber(groupStats.merit_median)}</div>
            <p className="text-xs text-muted-foreground mt-1">50% 成員高於此值</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>四分位距 (IQR)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatNumber(iqr)}</div>
            <p className="text-xs text-muted-foreground mt-1">Q3 - Q1</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>變異係數 (CV)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${groupStats.merit_cv > 0.3 ? 'text-muted-foreground' : 'text-primary'}`}>
              {(groupStats.merit_cv * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">{groupStats.merit_cv > 0.3 ? '分散度較高' : '分散度良好'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Box Plot Visual Representation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">戰功分佈概覽</CardTitle>
          <CardDescription>箱型圖統計（Min / Q1 / Median / Q3 / Max）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatNumber(groupStats.merit_min)}</span>
                <span>{formatNumber(groupStats.merit_median)}</span>
                <span>{formatNumber(groupStats.merit_max)}</span>
              </div>
              <div className="relative h-8">
                {/* Full range bar */}
                <div className="absolute inset-y-2 left-0 right-0 bg-muted rounded" />
                {/* IQR box */}
                <div
                  className="absolute inset-y-1 bg-primary/30 border-2 border-primary rounded"
                  style={{
                    left: `${((groupStats.merit_q1 - groupStats.merit_min) / (groupStats.merit_max - groupStats.merit_min)) * 100}%`,
                    right: `${((groupStats.merit_max - groupStats.merit_q3) / (groupStats.merit_max - groupStats.merit_min)) * 100}%`,
                  }}
                />
                {/* Median line */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-primary"
                  style={{
                    left: `${((groupStats.merit_median - groupStats.merit_min) / (groupStats.merit_max - groupStats.merit_min)) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Min</span>
                <span>Q1: {formatNumber(groupStats.merit_q1)}</span>
                <span>Q3: {formatNumber(groupStats.merit_q3)}</span>
                <span>Max</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tier Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">組內階層分布</CardTitle>
            <CardDescription>按組內相對戰功位置劃分</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={tierBarConfig} className="h-[200px] w-full">
              <BarChart data={tierBreakdown} margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="tier" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload as TierBreakdown
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{data.tier}</div>
                        <div className="text-sm">人數: {data.count} ({data.percentage}%)</div>
                        <div className="text-sm">平均戰功: {formatNumber(data.avg_merit)}</div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {tierBreakdown.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? TIER_COLORS.top : index === 2 ? TIER_COLORS.bottom : TIER_COLORS.mid}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>

            {/* Tier Details Table */}
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
                  {tierBreakdown.map((tier, index) => (
                    <tr key={tier.tier} className={`border-t ${getTierBgClass(index)}`}>
                      <td className="py-2">{tier.tier}</td>
                      <td className="text-right tabular-nums">
                        {tier.count} ({tier.percentage}%)
                      </td>
                      <td className="text-right tabular-nums">{formatNumber(tier.avg_merit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Merit Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">戰功與助攻趨勢</CardTitle>
            <CardDescription>組別人日均戰功/助攻變化</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={meritTrendConfig} className="h-[200px] w-full">
              <LineChart data={dailyData} margin={{ left: 12, right: 12 }}>
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
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(value) => formatNumberCompact(value)}
                />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload as (typeof dailyData)[0]
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{data.dateLabel}</div>
                        <div className="text-sm">人日均戰功: {formatNumber(data.avgMerit)}</div>
                        <div className="text-sm">人日均助攻: {data.avgAssist}</div>
                      </div>
                    )
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  yAxisId="left"
                  type="stepAfter"
                  dataKey="avgMerit"
                  name="人日均戰功"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="stepAfter"
                  dataKey="avgAssist"
                  name="人日均助攻"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================================
// Tab 3: Contribution Rank
// ============================================================================

interface ContributionRankTabProps {
  readonly groupStats: GroupStats
  readonly periodTrends: PeriodTrend[]
  readonly members: GroupMember[]
}

function ContributionRankTab({ groupStats, periodTrends, members }: ContributionRankTabProps) {
  // Expand periods to daily data for date-based X-axis
  const dailyData = useMemo(
    () =>
      expandPeriodsToDaily(periodTrends, (p) => ({
        avgRank: p.avg_rank,
        avgMerit: p.avg_merit,
        avgAssist: p.avg_assist,
      })),
    [periodTrends]
  )
  const xAxisTicks = useMemo(() => getPeriodBoundaryTicks(periodTrends), [periodTrends])

  // Calculate rank improvement
  const rankImprovement =
    periodTrends.length >= 2 ? periodTrends[0].avg_rank - periodTrends[periodTrends.length - 1].avg_rank : 0

  // Rank distribution histogram
  const rankDistribution = useMemo(() => {
    const bins = [
      { range: '1-50', min: 1, max: 50, count: 0 },
      { range: '51-100', min: 51, max: 100, count: 0 },
      { range: '101-150', min: 101, max: 150, count: 0 },
      { range: '151-200', min: 151, max: 200, count: 0 },
    ]

    for (const member of members) {
      for (const bin of bins) {
        if (member.contribution_rank >= bin.min && member.contribution_rank <= bin.max) {
          bin.count++
          break
        }
      }
    }

    return bins
  }, [members])

  return (
    <div className="space-y-6">
      {/* Rank Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="lg:col-span-2 border-primary/50">
          <CardHeader className="pb-2">
            <CardDescription>組別平均貢獻排名</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold tabular-nums">#{groupStats.avg_rank}</span>
              <span className="text-muted-foreground">/ 201人</span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                {rankImprovement >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-primary" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className={`text-sm ${rankImprovement >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {rankImprovement >= 0 ? '+' : ''}
                  {rankImprovement} 名 本賽季
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>最佳排名</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-primary">#{groupStats.best_rank}</div>
            <p className="text-xs text-muted-foreground mt-1">組內最高成員</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>最差排名</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-destructive">#{groupStats.worst_rank}</div>
            <p className="text-xs text-muted-foreground mt-1">組內最低成員</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rank Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">排名趨勢</CardTitle>
            <CardDescription>組別平均貢獻排名變化（數字越小排名越好）</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={rankTrendConfig} className="h-[250px] w-full">
              <LineChart data={dailyData} margin={{ left: 12, right: 12 }}>
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
                  reversed
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tickFormatter={(value) => `#${value}`}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload as (typeof dailyData)[0]
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{data.dateLabel}</div>
                        <div className="text-sm">平均排名: #{data.avgRank}</div>
                      </div>
                    )
                  }}
                />
                <Line
                  type="stepAfter"
                  dataKey="avgRank"
                  name="平均排名"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Rank Distribution Histogram */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">排名分佈</CardTitle>
            <CardDescription>組內成員在全盟排名的分佈</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={rankDistributionConfig} className="h-[250px] w-full">
              <BarChart data={rankDistribution} margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="range" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload as (typeof rankDistribution)[0]
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">排名 {data.range}</div>
                        <div className="text-sm">{data.count} 人</div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Period Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">期間明細</CardTitle>
          <CardDescription>貢獻排名是官方綜合指標，反映成員整體表現</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium">期間</th>
                  <th className="text-right py-2 px-2 font-medium">平均排名</th>
                  <th className="text-right py-2 px-2 font-medium">變化</th>
                  <th className="text-right py-2 px-2 font-medium">人日均戰功</th>
                  <th className="text-right py-2 px-2 font-medium">人日均助攻</th>
                  <th className="text-right py-2 px-2 font-medium">成員數</th>
                </tr>
              </thead>
              <tbody>
                {periodTrends.map((d, index) => {
                  const prevRank = index > 0 ? periodTrends[index - 1].avg_rank : null
                  const rankChange = prevRank ? prevRank - d.avg_rank : null

                  return (
                    <tr key={d.period_number} className="border-b last:border-0">
                      <td className="py-2 px-2 text-muted-foreground">{d.period_label}</td>
                      <td className="py-2 px-2 text-right tabular-nums font-medium">#{d.avg_rank}</td>
                      <td className="py-2 px-2 text-right">
                        {rankChange !== null ? (
                          <span className={rankChange >= 0 ? 'text-primary' : 'text-destructive'}>
                            {rankChange >= 0 ? '+' : ''}
                            {rankChange}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">{formatNumber(d.avg_merit)}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{d.avg_assist}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-muted-foreground">{d.member_count}</td>
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
// Tab 4: Member Rankings
// ============================================================================

interface MembersTabProps {
  readonly members: GroupMember[]
}

function MembersTab({ members }: MembersTabProps) {
  const [sortBy, setSortBy] = useState<'rank' | 'merit' | 'assist'>('rank')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sortedMembers = useMemo(() => {
    const sorted = [...members].sort((a, b) => {
      let aVal: number
      let bVal: number

      switch (sortBy) {
        case 'rank':
          aVal = a.contribution_rank
          bVal = b.contribution_rank
          break
        case 'merit':
          aVal = a.daily_merit
          bVal = b.daily_merit
          break
        case 'assist':
          aVal = a.daily_assist
          bVal = b.daily_assist
          break
        default:
          return 0
      }

      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    })
    return sorted
  }, [members, sortBy, sortDir])

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(column)
      setSortDir(column === 'rank' ? 'asc' : 'desc')
    }
  }

  // Tier counts based on within-group merit ranking
  const tierCounts = useMemo(() => {
    const counts = { top: 0, mid: 0, bottom: 0 }
    for (const member of members) {
      const tier = getMemberTier(member, members)
      counts[tier]++
    }
    return counts
  }, [members])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Top 20%（高表現）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-primary">{tierCounts.top}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((tierCounts.top / members.length) * 100).toFixed(0)}% of group
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mid 60%（中等）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{tierCounts.mid}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((tierCounts.mid / members.length) * 100).toFixed(0)}% of group
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bot 20%（需關注）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-destructive">{tierCounts.bottom}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((tierCounts.bottom / members.length) * 100).toFixed(0)}% of group
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">組內成員列表</CardTitle>
          <CardDescription>點擊欄位標題排序（階層依組內戰功相對位置劃分）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium">成員</th>
                  <th
                    className="text-right py-2 px-2 font-medium cursor-pointer hover:text-primary"
                    onClick={() => handleSort('rank')}
                  >
                    貢獻排名 {sortBy === 'rank' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-right py-2 px-2 font-medium cursor-pointer hover:text-primary"
                    onClick={() => handleSort('merit')}
                  >
                    日均戰功 {sortBy === 'merit' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-right py-2 px-2 font-medium cursor-pointer hover:text-primary"
                    onClick={() => handleSort('assist')}
                  >
                    日均助攻 {sortBy === 'assist' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-right py-2 px-2 font-medium">排名變化</th>
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((member) => {
                  const tier = getMemberTier(member, members)
                  return (
                    <tr key={member.id} className={`border-b last:border-0 ${getTierBgColor(tier)}`}>
                      <td className="py-2 px-2 font-medium">{member.name}</td>
                      <td className="py-2 px-2 text-right tabular-nums">#{member.contribution_rank}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{formatNumber(member.daily_merit)}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{member.daily_assist}</td>
                      <td className="py-2 px-2 text-right">
                        <RankChangeIndicator change={member.rank_change} showNewLabel={false} />
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

function GroupAnalytics() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(MOCK_GROUPS[0].id)
  const [activeTab, setActiveTab] = useState('overview')

  const selectedGroup = useMemo(() => {
    return MOCK_GROUPS.find((g) => g.id === selectedGroupId)
  }, [selectedGroupId])

  const groupStats = useMemo(() => getGroupStats(selectedGroupId), [selectedGroupId])
  const tierBreakdown = useMemo(() => generateTierBreakdown(groupStats), [groupStats])
  const periodTrends = useMemo(() => getPeriodTrends(selectedGroupId), [selectedGroupId])
  const groupMembers = useMemo(() => getGroupMembers(selectedGroupId), [selectedGroupId])
  const allGroupsData = useMemo(() => getAllGroupsComparison(), [])

  return (
    <AllianceGuard>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">組別分析</h2>
            <p className="text-muted-foreground mt-1">查看各組別的人日均表現與統計數據</p>
          </div>
        </div>

        {/* Group Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">選擇組別:</span>
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="選擇組別" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_GROUPS.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name} ({group.memberCount}人)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedGroup && (
            <span className="text-sm text-muted-foreground">{selectedGroup.memberCount} 位成員</span>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">總覽</span>
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">戰功分佈</span>
            </TabsTrigger>
            <TabsTrigger value="rank" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">貢獻排名</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">組內成員</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab groupStats={groupStats} allGroupsData={allGroupsData} />
          </TabsContent>

          <TabsContent value="distribution">
            <MeritDistributionTab groupStats={groupStats} tierBreakdown={tierBreakdown} periodTrends={periodTrends} />
          </TabsContent>

          <TabsContent value="rank">
            <ContributionRankTab groupStats={groupStats} periodTrends={periodTrends} members={groupMembers} />
          </TabsContent>

          <TabsContent value="members">
            <MembersTab members={groupMembers} />
          </TabsContent>
        </Tabs>
      </div>
    </AllianceGuard>
  )
}

export default GroupAnalytics
