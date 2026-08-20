import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  LineChart, TrendingUp, DollarSign, RefreshCw, Loader2, ArrowUpRight, ArrowDownRight,
  BarChart3, Target, Trophy, Zap, Users, Clock, Percent, CircleDollarSign, ChevronRight
} from 'lucide-react'
import { formatDate, formatMoney } from '@/lib/org-format'

function money(v: any) {
  return formatMoney(Number(v || 0))
}

function moneyShort(v: any) {
  const n = Number(v || 0)
  if (n >= 1_000_000) return `${formatMoney(n / 1_000_000).replace(/[\d.,\s]+$/, '').trim()}${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${formatMoney(n / 1_000).replace(/[\d.,\s]+$/, '').trim()}${(n / 1_000).toFixed(0)}K`
  return formatMoney(n)
}

const STAGE_TONES: Record<string, { bar: string; badge: string }> = {
  'Closed Won':  { bar: 'from-emerald-400 to-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  'Won':         { bar: 'from-emerald-400 to-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  'Closed Lost': { bar: 'from-rose-400 to-rose-500', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  'Lost':        { bar: 'from-rose-400 to-rose-500', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  'Negotiation/Review': { bar: 'from-amber-400 to-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  'Proposal/Price Quote': { bar: 'from-orange-400 to-orange-500', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  'Value Proposition': { bar: 'from-sky-400 to-sky-500', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  'Needs Analysis': { bar: 'from-blue-400 to-blue-500', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  'Qualification': { bar: 'from-indigo-400 to-indigo-500', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  'Initial Contact': { bar: 'from-violet-400 to-violet-500', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  'New':         { bar: 'from-slate-400 to-slate-500', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400' },
}
const DEFAULT_TONE = { bar: 'from-slate-400 to-slate-500', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400' }

const PIPELINE_COLORS = [
  { label: 'Closed Won', color: '#10b981', bg: 'bg-emerald-500' },
  { label: 'In Progress', color: '#3b82f6', bg: 'bg-blue-500' },
  { label: 'Closed Lost', color: '#f43f5e', bg: 'bg-rose-500' },
]

function StageBar({ stage, count, amount, totalAmount }: { stage: string; count: number; amount: number; totalAmount: number }) {
  const pct = totalAmount > 0 ? (amount / totalAmount) * 100 : 0
  const tone = STAGE_TONES[stage] || DEFAULT_TONE
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">{stage}</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{count}</span>
          <span className="font-semibold tabular-nums">{moneyShort(amount)}</span>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone.bar} transition-all duration-700 ease-out`}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>
    </div>
  )
}

export function ForecastPage() {
  const [range, setRange] = useState('quarter')
  const [scenario, setScenario] = useState<'conservative' | 'base' | 'upside'>('base')
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['forecast', range],
    queryFn: () => api.getForecast(range),
  })

  const recalcMutation = useMutation({
    mutationFn: () => api.recalculateForecast(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecast'] })
      addToast({ title: 'Forecast recalculated', description: 'Opportunity amounts weighted by probability', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const forecast = data?.data?.forecast || []
  const pipeline = data?.data?.pipeline || { won: { count: 0, amount: 0 }, lost: { count: 0, amount: 0 }, pipeline: { count: 0, amount: 0 } }
  const recent = data?.data?.recent || []
  const totals = data?.data?.totals || { expected: 0, weighted: 0 }
  const scenarioFactor = scenario === 'conservative' ? 0.75 : scenario === 'upside' ? 1.2 : 1
  const scenarioForecast = Number(totals.weighted || 0) * scenarioFactor
  const coverage = totals.expected > 0 ? Math.round((scenarioForecast / totals.expected) * 100) : 0
  const maxVal = Math.max(...forecast.map((f: any) => f.expected), 1)

  const totalPipelineAmt = pipeline.won.amount + pipeline.pipeline.amount + pipeline.lost.amount
  const winRate = pipeline.won.count + pipeline.lost.count > 0
    ? Math.round((pipeline.won.count / (pipeline.won.count + pipeline.lost.count)) * 100)
    : 0

  // Build donut segments
  const donutSegments = (() => {
    const segments = [
      { ...PIPELINE_COLORS[0], value: pipeline.won.amount },
      { ...PIPELINE_COLORS[1], value: pipeline.pipeline.amount },
      { ...PIPELINE_COLORS[2], value: pipeline.lost.amount },
    ]
    const total = segments.reduce((s, x) => s + x.value, 0) || 1
    let cumulative = 0
    return segments.map(s => {
      const start = (cumulative / total) * 360
      const deg = (s.value / total) * 360
      cumulative += s.value
      return { ...s, start, deg }
    })
  })()

  // Group recent by stage for breakdown
  const stageBreakdown: Record<string, { count: number; amount: number }> = {}
  for (const r of recent) {
    const stage = r.stage || 'Unknown'
    if (!stageBreakdown[stage]) stageBreakdown[stage] = { count: 0, amount: 0 }
    stageBreakdown[stage].count++
    stageBreakdown[stage].amount += Number(r.amount || 0)
  }
  const sortedStages = Object.entries(stageBreakdown).sort((a, b) => b[1].amount - a[1].amount)

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-6 py-8 md:px-8 md:py-10 text-white shadow-xl shadow-indigo-500/20">
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-transparent" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-violet-500/20 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-lg">
                <BarChart3 size={22} />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Opportunity Forecasting</h1>
            </div>
            <p className="text-blue-100/80 text-sm md:text-base max-w-lg">
              Visualize your sales pipeline, track weighted forecasts, and identify revenue opportunities by close period.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-40 bg-white/15 border-white/25 text-white hover:bg-white/25 backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quarter">Next 4 months</SelectItem>
                <SelectItem value="year">Next 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => recalcMutation.mutate()}
              disabled={recalcMutation.isPending}
              className="bg-white/15 border-white/25 text-white hover:bg-white/25 backdrop-blur-sm"
            >
              {recalcMutation.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <RefreshCw size={14} className="mr-1.5" />}
              Recalculate
            </Button>
          </div>
        </div>
      </div>

      <Card className="border-indigo-200/60 bg-gradient-to-r from-indigo-50/70 to-violet-50/50 dark:border-indigo-900 dark:from-indigo-950/30 dark:to-violet-950/20">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Forecast scenario</p>
              <h2 className="mt-1 text-lg font-semibold">{money(scenarioForecast)} projected weighted revenue</h2>
              <p className="text-sm text-muted-foreground">{coverage}% of the unweighted pipeline · adjust the scenario to understand risk.</p>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-xl border bg-background p-1">
              {[
                ['conservative', 'Conservative', '75%'], ['base', 'Base case', '100%'], ['upside', 'Upside', '120%'],
              ].map(([key, label, factor]) => (
                <button key={key} onClick={() => setScenario(key as any)} className={`rounded-lg px-3 py-2 text-left transition-colors ${scenario === key ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-muted'}`}>
                  <span className="block text-xs font-semibold">{label}</span><span className={`text-[10px] ${scenario === key ? 'text-indigo-100' : 'text-muted-foreground'}`}>{factor} weighted</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 overflow-hidden relative">
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
          <CardContent className="pt-5 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Trophy size={18} className="text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight size={12} />
                Won
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Closed Won</p>
            <p className="text-2xl font-bold mt-0.5 tabular-nums">{moneyShort(pipeline.won.amount)}</p>
            <p className="text-xs text-muted-foreground mt-1">{pipeline.won.count} {pipeline.won.count === 1 ? 'deal' : 'deals'}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 overflow-hidden relative">
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />
          <CardContent className="pt-5 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Target size={18} className="text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                <Zap size={12} />
                Active
              </div>
            </div>
            <p className="text-sm text-muted-foreground">In Pipeline</p>
            <p className="text-2xl font-bold mt-0.5 tabular-nums">{moneyShort(pipeline.pipeline.amount)}</p>
            <p className="text-xs text-muted-foreground mt-1">{pipeline.pipeline.count} open {pipeline.pipeline.count === 1 ? 'opportunity' : 'opportunities'}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/20 overflow-hidden relative">
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-violet-500/10 blur-xl pointer-events-none" />
          <CardContent className="pt-5 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <DollarSign size={18} className="text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400">
                <CircleDollarSign size={12} />
                Total
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Expected Revenue</p>
            <p className="text-2xl font-bold mt-0.5 tabular-nums">{moneyShort(totals.expected)}</p>
            <p className="text-xs text-muted-foreground mt-1">Across all opportunities</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 overflow-hidden relative">
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />
          <CardContent className="pt-5 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <TrendingUp size={18} className="text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                <Percent size={12} />
                Weighted
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Weighted Forecast</p>
            <p className="text-2xl font-bold mt-0.5 tabular-nums">{moneyShort(scenarioForecast)}</p>
            <p className="text-xs text-muted-foreground mt-1">{winRate}% win rate · {scenario} scenario</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 size={16} className="text-indigo-500" />
                Revenue by Period
              </CardTitle>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Expected</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-200 dark:bg-indigo-800" /> Weighted</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : forecast.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BarChart3 size={40} className="text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No forecast data available</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Create opportunities with amounts and closing dates</p>
              </div>
            ) : (
              <div className="flex items-end gap-2 md:gap-4 h-56 pt-2">
                {forecast.map((f: any) => {
                  const expectedPct = Math.max((f.expected / maxVal) * 100, 2)
                  const weightedValue = f.weighted * scenarioFactor
                  const weightedPct = Math.max((weightedValue / maxVal) * 100, 2)
                  return (
                    <div key={f.period} className="flex-1 flex flex-col items-center gap-1 min-w-0 group/bar">
                      <div className="w-full flex items-end justify-center gap-1 h-44">
                        <div
                          className="w-1/2 rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 hover:from-indigo-700 hover:to-indigo-500 transition-all duration-300 cursor-pointer relative shadow-sm hover:shadow-md"
                          style={{ height: `${expectedPct}%` }}
                          title={`Expected: ${money(f.expected)}`}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {moneyShort(f.expected)}
                          </div>
                        </div>
                        <div
                          className="w-1/2 rounded-t-md bg-gradient-to-t from-indigo-300 to-indigo-200 dark:from-indigo-800 dark:to-indigo-600 hover:from-indigo-400 hover:to-indigo-300 transition-all duration-300 cursor-pointer relative shadow-sm hover:shadow-md"
                          style={{ height: `${weightedPct}%` }}
                          title={`${scenario} forecast: ${money(weightedValue)}`}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {moneyShort(weightedValue)}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground truncate w-full text-center">{f.period}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Donut */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target size={16} className="text-blue-500" />
              Pipeline Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {/* CSS Donut */}
            <div className="relative w-44 h-44 mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {donutSegments.map((s, i) => (
                  s.deg > 0 && (
                    <circle
                      key={i}
                      cx="50" cy="50" r="38"
                      fill="none"
                      stroke={s.color}
                      strokeWidth="14"
                      strokeDasharray={`${(s.deg / 360) * 238.76} 238.76`}
                      strokeDashoffset={`${-(s.start / 360) * 238.76}`}
                      className="transition-all duration-700"
                    />
                  )
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold">{moneyShort(totalPipelineAmt)}</p>
                <p className="text-[11px] text-muted-foreground">Total Value</p>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full space-y-3">
              {[
                { label: 'Closed Won', count: pipeline.won.count, amount: pipeline.won.amount, color: 'bg-emerald-500' },
                { label: 'In Progress', count: pipeline.pipeline.count, amount: pipeline.pipeline.amount, color: 'bg-blue-500' },
                { label: 'Closed Lost', count: pipeline.lost.count, amount: pipeline.lost.amount, color: 'bg-rose-500' },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${row.color} shrink-0`} />
                  <span className="text-sm flex-1">{row.label}</span>
                  <span className="text-xs text-muted-foreground">{row.count}</span>
                  <span className="text-sm font-semibold tabular-nums">{moneyShort(row.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Breakdown + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stage Breakdown */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users size={16} className="text-emerald-500" />
              Pipeline by Stage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedStages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users size={32} className="text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No opportunities in pipeline</p>
              </div>
            ) : (
              sortedStages.map(([stage, { count, amount }]) => (
                <StageBar key={stage} stage={stage} count={count} amount={amount} totalAmount={totalPipelineAmt} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Opportunities */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock size={16} className="text-violet-500" />
                Recent Opportunities
              </CardTitle>
              <span className="text-xs text-muted-foreground">{recent.length} total</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock size={32} className="text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No opportunities yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Create opportunities to see them here</p>
              </div>
            ) : (
              recent.slice(0, 15).map((p: any) => {
                const tone = STAGE_TONES[p.stage || ''] || DEFAULT_TONE
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-gradient-to-r from-background to-muted/20 px-3.5 py-2.5 hover:shadow-sm hover:border-border transition-all duration-200 group cursor-pointer">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{p.potentialName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium ${tone.badge}`}>
                          {p.stage || '—'}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock size={10} />
                          {p.closingDate ? formatDate(p.closingDate) : 'No date'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold tabular-nums">{moneyShort(p.forecastAmount)}</p>
                      <p className="text-[11px] text-muted-foreground">{p.probability}% · {moneyShort(p.amount)}</p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground ml-2 shrink-0 transition-colors" />
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
