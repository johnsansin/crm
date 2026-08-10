import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Building2, Users, UserPlus, TrendingUp, LifeBuoy, Package, FolderKanban, Receipt, CalendarDays, Filter, PlusCircle, LayoutDashboard, Check, RotateCcw, Save, BarChart3, PieChart, ListTodo, Ticket, User, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOrgSettings, formatDateTime, weekDayNames } from '@/lib/org-format'
import { useViewableModules } from '@/lib/permissions'
import { t } from '@/lib/i18n'

const statCards = [
  { module: 'accounts', label: 'Accounts', icon: Building2, tile: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
  { module: 'contacts', label: 'Contacts', icon: Users, tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  { module: 'leads', label: 'Leads', icon: UserPlus, tile: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' },
  { module: 'potentials', label: 'Opportunities', icon: TrendingUp, tile: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  { module: 'tickets', label: 'Tickets', icon: LifeBuoy, tile: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' },
  { module: 'products', label: 'Products', icon: Package, tile: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400' },
  { module: 'projects', label: 'Projects', icon: FolderKanban, tile: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400' },
  { module: 'invoices', label: 'Invoices', icon: Receipt, tile: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400' },
]

const quickActions = [
  { to: '/leads/new', label: 'New Lead', module: 'leads' },
  { to: '/potentials/new', label: 'New Opportunity', module: 'potentials' },
  { to: '/tickets/new', label: 'New Ticket', module: 'tickets' },
  { to: '/projects/new', label: 'New Project', module: 'projects' },
]

type WidgetKey = 'stats' | 'salesByMonth' | 'funnel' | 'projectMilestones' | 'recentLeads' | 'leadsByStatus' | 'upcoming' | 'openPotentials' | 'openTickets' | 'recentPotentials' | 'recentTickets'

const WIDGETS: { key: WidgetKey; label: string; icon: React.ElementType; tint: string; span: string; module: string | null; render: () => React.ReactNode }[] = [
  { key: 'stats', label: 'Summary cards', icon: LayoutDashboard, tint: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400', span: 'md:col-span-2 xl:col-span-3', module: null, render: () => <StatGrid /> },
  { key: 'salesByMonth', label: 'Sales by month', icon: BarChart3, tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', span: 'xl:col-span-2', module: 'potentials', render: () => <SalesByMonthWidget /> },
  { key: 'funnel', label: 'Sales funnel', icon: Filter, tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', span: '', module: 'potentials', render: () => <SalesFunnelWidget /> },
  { key: 'projectMilestones', label: 'Projects & milestones', icon: FolderKanban, tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', span: '', module: 'projectmilestones', render: () => <ProjectMilestonesWidget /> },
  { key: 'recentLeads', label: 'Recent leads', icon: User, tint: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400', span: '', module: 'leads', render: () => <RecentLeadsWidget /> },
  { key: 'leadsByStatus', label: 'Leads by status', icon: PieChart, tint: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400', span: '', module: 'leads', render: () => <LeadsByStatusWidget /> },
  { key: 'upcoming', label: 'Upcoming activities', icon: CalendarDays, tint: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400', span: '', module: null, render: () => <UpcomingActivitiesWidget /> },
  { key: 'openPotentials', label: 'My open opportunities', icon: TrendingUp, tint: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400', span: '', module: 'potentials', render: () => <OpenOpportunitiesWidget /> },
  { key: 'openTickets', label: 'My open tickets', icon: LifeBuoy, tint: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400', span: '', module: 'tickets', render: () => <OpenTicketsWidget /> },
  { key: 'recentPotentials', label: 'Recent opportunities', icon: ListTodo, tint: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400', span: '', module: 'potentials', render: () => <RecentWidget module="potentials" title="Recent Opportunities" primary="potentialName" secondary={['stage', 'amount']} icon={TrendingUp} tint="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" empty="No opportunities yet" /> },
  { key: 'recentTickets', label: 'Recent tickets', icon: Ticket, tint: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400', span: '', module: 'tickets', render: () => <RecentWidget module="tickets" title="Recent Tickets" primary="title" secondary={['status', 'priority']} icon={LifeBuoy} tint="bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400" empty="No tickets yet" /> },
]

const WIDGET_KEYS = WIDGETS.map(w => w.key)
const DEFAULT_ORDER: WidgetKey[] = [...WIDGET_KEYS]

function resolveConfig(saved: any): { order: WidgetKey[]; hidden: WidgetKey[] } {
  const order: WidgetKey[] = Array.isArray(saved?.order) ? saved.order.filter((k: any) => (WIDGET_KEYS as string[]).includes(k)) : []
  const hidden: WidgetKey[] = Array.isArray(saved?.hidden) ? saved.hidden.filter((k: any) => (WIDGET_KEYS as string[]).includes(k)) : []
  for (const k of DEFAULT_ORDER) if (!order.includes(k)) order.push(k)
  return { order, hidden }
}

export function DashboardPage() {
  const { user } = useAuthStore()
  useOrgSettings()
  const queryClient = useQueryClient()
  const viewable = useViewableModules()
  const name = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'there'
  const today = `${weekDayNames('long')[new Date().getDay()]}, ${formatDateTime(new Date())}`

  const { data: cfg } = useQuery({
    queryKey: ['dashboard-config'],
    queryFn: () => api.getDashboardConfig(),
  })
  const [order, setOrder] = useState<WidgetKey[] | null>(null)
  const [hidden, setHidden] = useState<WidgetKey[]>([])
  const [editing, setEditing] = useState(false)
  const [dragKey, setDragKey] = useState<WidgetKey | null>(null)
  const [overKey, setOverKey] = useState<WidgetKey | null>(null)

  useEffect(() => {
    if (order === null && cfg?.config) {
      const resolved = resolveConfig(cfg.config)
      setOrder(resolved.order)
      setHidden(resolved.hidden)
    }
  }, [cfg, order])

  const save = useMutation({
    mutationFn: () => api.updateDashboardConfig({ order: order ?? DEFAULT_ORDER, hidden }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-config'] })
      setEditing(false)
      setDragKey(null)
      setOverKey(null)
    },
  })

  const toggleVisible = (key: WidgetKey) => {
    setHidden(h => h.includes(key) ? h.filter(k => k !== key) : [...h, key])
  }

  const reorderFull = (from: WidgetKey, to: WidgetKey) => {
    if (from === to) return
    setOrder(o => {
      const cur = [...(o ?? [...DEFAULT_ORDER])]
      const fromIdx = cur.indexOf(from)
      const toIdx = cur.indexOf(to)
      if (fromIdx < 0 || toIdx < 0) return cur
      const [moved] = cur.splice(fromIdx, 1)
      cur.splice(toIdx, 0, moved)
      return cur
    })
  }

  const persistOrder = (nextOrder: WidgetKey[]) => {
    api.updateDashboardConfig({ order: nextOrder, hidden }).catch(() => {})
    queryClient.invalidateQueries({ queryKey: ['dashboard-config'] })
  }

  const moveCard = (from: WidgetKey, to: WidgetKey) => {
    if (from === to) return
    const cur = order ?? [...DEFAULT_ORDER]
    const vis = cur.filter(k => !hidden.includes(k))
    const fromIdx = vis.indexOf(from)
    const toIdx = vis.indexOf(to)
    if (fromIdx < 0 || toIdx < 0) return
    const next = [...vis]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    const nextOrder = [...next, ...cur.filter(k => hidden.includes(k))]
    setOrder(nextOrder)
    if (!editing) persistOrder(nextOrder)
  }

  const clearDrag = () => { setDragKey(null); setOverKey(null) }

  const effectiveOrder = order ?? [...DEFAULT_ORDER]
  const canViewWidget = (module: string | null) => !module || viewable.has(module)
  const widgets = effectiveOrder
    .filter(key => !hidden.includes(key))
    .map(key => WIDGETS.find(w => w.key === key))
    .filter((w): w is (typeof WIDGETS)[number] => Boolean(w))
    .filter(w => canViewWidget(w.module))

  const visibleQuickActions = quickActions.filter(a => viewable.has(a.module))

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">{t('Welcome back, {name}', { name })}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{today}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {visibleQuickActions.map(a => (
                <Link key={a.to} to={a.to} className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                  <PlusCircle size={13} /> {t(a.label)}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setEditing(v => !v)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  editing ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {editing ? <Check size={13} /> : <LayoutDashboard size={13} />} {editing ? t('Done') : t('Customize')}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {editing && (
        <Card className="border-indigo-200 dark:border-indigo-900">
          <CardContent className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">{t('Customize Dashboard')}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{t('Drag widgets to reorder, or toggle them on and off. Your layout is saved for you only.')}</p>
              </div>
              <button
                type="button"
                onClick={() => { setOrder([...DEFAULT_ORDER]); setHidden([]) }}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
              >
                <RotateCcw size={13} /> {t('Reset to default')}
              </button>
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {effectiveOrder.filter(k => canViewWidget(WIDGETS.find(x => x.key === k)?.module || null)).map((key) => {
                const w = WIDGETS.find(x => x.key === key)
                if (!w) return null
                const isHidden = hidden.includes(key)
                return (
                  <div
                    key={key}
                    draggable
                    onDragStart={(e) => { setDragKey(key); e.dataTransfer.effectAllowed = 'move' }}
                    onDragOver={(e) => { e.preventDefault(); if (overKey !== key) setOverKey(key) }}
                    onDrop={(e) => { e.preventDefault(); reorderFull(dragKey || key, key) }}
                    onDragEnd={clearDrag}
                    className={cn(
                      'flex cursor-grab items-center gap-3 rounded-lg border bg-background px-3 py-2.5 active:cursor-grabbing transition-opacity',
                      isHidden && 'opacity-50',
                      overKey === key && dragKey !== key && 'ring-2 ring-indigo-400'
                    )}
                  >
                    <span className="text-muted-foreground"><GripVertical size={16} /></span>
                    <span className="flex-1 truncate text-sm font-medium">{t(w.label)}</span>
                    <Switch checked={!isHidden} onCheckedChange={() => toggleVisible(key)} aria-label={`Show ${w.label}`} />
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { const r = cfg?.config ? resolveConfig(cfg.config) : { order: [...DEFAULT_ORDER], hidden: [] as WidgetKey[] }; setOrder(r.order); setHidden(r.hidden); setEditing(false); clearDrag() }}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                <Save size={15} /> {save.isPending ? t('Saving...') : t('Save layout')}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <div
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        onClickCapture={editing ? (e) => {
          const a = (e.target as HTMLElement).closest('a')
          if (a) { e.preventDefault(); e.stopPropagation() }
        } : undefined}
      >
        {widgets.map(w => (
          <div
            key={w.key}
            draggable
            onDragStart={(e) => { setDragKey(w.key); e.dataTransfer.effectAllowed = 'move' }}
            onDragOver={(e) => { e.preventDefault(); if (overKey !== w.key) setOverKey(w.key) }}
            onDrop={(e) => { e.preventDefault(); moveCard(dragKey || w.key, w.key) }}
            onDragEnd={clearDrag}
            className={cn(
              'content-start relative group',
              w.span,
              'cursor-grab active:cursor-grabbing',
              editing && 'outline outline-dashed outline-1 outline-offset-4 outline-muted-foreground/30',
              dragKey === w.key && 'opacity-40',
              overKey === w.key && dragKey !== w.key && 'outline-indigo-400'
            )}
          >
            {!editing && (
              <span className="pointer-events-none absolute -top-2 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-muted-foreground/10 px-2 py-0.5 text-[10px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" title={t('Drag to reorder')}>
                <GripVertical size={11} />
              </span>
            )}
            {editing && (
              <span className="pointer-events-none absolute -top-2 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-medium text-white shadow">
                <GripVertical size={11} /> {t('Drag')}
              </span>
            )}
            {w.render()}
          </div>
        ))}
      </div>
      {widgets.length === 0 && (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <LayoutDashboard size={32} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground/80">{t('Nothing to show yet')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('Your role has no module permissions yet. Ask an administrator to grant access in the Permission Manager.')}</p>
        </div>
      )}
    </div>
  )
}

function StatCard({ module, label, icon: Icon, tile }: { module: string; label: string; icon: React.ElementType; tile: string }) {
  const { data } = useQuery({
    queryKey: [module, 'count'],
    queryFn: () => api.list(module, { limit: '1' }),
  })

  return (
    <Link to={`/${module}`} className="group block">
      <Card className="transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg', tile)}>
              <Icon size={18} strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t(label)}</p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums leading-tight">{data?.pagination?.total ?? '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function StatGrid() {
  const viewable = useViewableModules()
  const cards = statCards.filter(c => viewable.has(c.module))
  if (cards.length === 0) return null
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8">
      {cards.map((card) => (
        <StatCard key={card.module} {...card} />
      ))}
    </div>
  )
}

function WidgetCard({ title, icon: Icon, tint, children }: { title: string; icon: React.ElementType; tint: string; children: React.ReactNode }) {
  return (
    <Card className="h-full overflow-hidden">
      <div className="flex items-center gap-2.5 border-b px-4 py-3">
        <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-md', tint)}>
          <Icon size={14} strokeWidth={1.75} />
        </span>
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{t(title)}</h3>
      </div>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
}

function WidgetRow({ to, primary, secondary }: { to: string; primary: string; secondary?: string }) {
  return (
    <Link to={to} className="flex items-center justify-between gap-3 border-b px-4 py-2.5 text-sm last:border-0 transition-colors hover:bg-accent">
      <span className="min-w-0 flex-1 truncate font-medium">{primary}</span>
      {secondary ? <span className="min-w-0 shrink-0 truncate text-xs text-muted-foreground">{secondary}</span> : null}
    </Link>
  )
}

function WidgetEmpty({ label }: { label: string }) {
  return <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t(label)}</p>
}

function fmtMoney(v: any) {
  if (v == null || v === '') return ''
  const n = Number(v)
  if (isNaN(n)) return ''
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function OpenOpportunitiesWidget() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['potentials', 'open'],
    queryFn: () => api.list('potentials', { filter: JSON.stringify({ stage: { notIn: ['Closed Won', 'Closed Lost'] }, assignedTo: user?.id }), limit: '5', sortBy: 'updatedAt', sortOrder: 'desc' }),
  })
  const closed = ['closed won', 'closed lost']
  const items = (data?.data || []).filter((r: any) => !closed.includes((r.stage || '').toLowerCase()))

  return (
    <WidgetCard title="My Open Opportunities" icon={TrendingUp} tint="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
      {isLoading ? <WidgetEmpty label="Loading..." /> : items.length === 0 ? <WidgetEmpty label="No open opportunities" /> : items.map((r: any) => (
        <WidgetRow key={r.id} to={`/potentials/${r.id}`} primary={r.potentialName} secondary={[r.stage, fmtMoney(r.amount)].filter(Boolean).join(' · ')} />
      ))}
    </WidgetCard>
  )
}

function OpenTicketsWidget() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['tickets', 'open'],
    queryFn: () => api.list('tickets', { filter: JSON.stringify({ status: { notIn: ['Closed'] }, assignedTo: user?.id }), limit: '5', sortBy: 'updatedAt', sortOrder: 'desc' }),
  })
  const items = (data?.data || []).filter((r: any) => (r.status || '').toLowerCase() !== 'closed')

  return (
    <WidgetCard title="My Open Tickets" icon={LifeBuoy} tint="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
      {isLoading ? <WidgetEmpty label="Loading..." /> : items.length === 0 ? <WidgetEmpty label="No open tickets" /> : items.map((r: any) => (
        <WidgetRow key={r.id} to={`/tickets/${r.id}`} primary={r.title} secondary={[r.status, r.priority].filter(Boolean).join(' · ')} />
      ))}
    </WidgetCard>
  )
}

function RecentWidget({ module, title, primary, secondary, icon, tint, empty }: { module: string; title: string; primary: string; secondary: string[]; icon: React.ElementType; tint: string; empty: string }) {
  const { data, isLoading } = useQuery({
    queryKey: [module, 'recent'],
    queryFn: () => api.list(module, { limit: '5', sortBy: 'createdAt', sortOrder: 'desc' }),
  })
  const rows = data?.data || []

  return (
    <WidgetCard title={title} icon={icon} tint={tint}>
      {isLoading ? <WidgetEmpty label="Loading..." /> : rows.length === 0 ? <WidgetEmpty label={empty} /> : rows.slice(0, 5).map((r: any) => (
        <WidgetRow key={r.id} to={`/${module}/${r.id}`} primary={r[primary]} secondary={secondary.map(f => f === 'amount' ? fmtMoney(r[f]) : r[f]).filter(Boolean).join(' · ')} />
      ))}
    </WidgetCard>
  )
}

function SalesFunnelWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['potentials', 'funnel'],
    queryFn: () => api.listAll('potentials'),
  })
  const records = (data?.data || []).filter((r: any) => (r.stage || '').toLowerCase() !== 'closed lost')
  const stageOrder = ['Prospecting', 'Qualification', 'Needs Analysis', 'Value Proposition', 'Negotiation', 'Closed Won']
  const groups = stageOrder.map(stage => {
    const rows = records.filter((r: any) => r.stage === stage)
    return { stage, count: rows.length, amount: rows.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0) }
  }).filter(g => g.count > 0)
  const max = Math.max(...groups.map(g => g.count), 1)
  const total = records.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0)

  return (
    <WidgetCard title="Sales Funnel" icon={Filter} tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
      {isLoading ? <WidgetEmpty label="Loading..." /> : groups.length === 0 ? <WidgetEmpty label="No opportunities to show" /> : (
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">{t('Pipeline value')}</span>
            <span className="font-bold tabular-nums">{fmtMoney(total)}</span>
          </div>
          {groups.map(g => (
            <div key={g.stage}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{g.stage}</span>
                <span className="text-muted-foreground">{g.count} · {fmtMoney(g.amount)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round((g.count / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  )
}

function SalesByMonthWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['potentials', 'salesByMonth'],
    queryFn: () => api.listAll('potentials'),
  })
  const now = new Date()
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-US', { month: 'short' }), total: 0 }
  })
  for (const r of (data?.data || [])) {
    const amt = Number(r.amount) || 0
    const raw = r.closingDate || r.createdAt
    const d = raw ? new Date(raw) : null
    if (!d || isNaN(d.getTime())) continue
    const b = buckets.find(b => b.key === `${d.getFullYear()}-${d.getMonth()}`)
    if (b) b.total += amt
  }
  const max = Math.max(...buckets.map(b => b.total), 1)

  const short = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)

  return (
    <WidgetCard title="Sales by Month" icon={BarChart3} tint="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
      {isLoading ? <WidgetEmpty label="Loading..." /> : (
        <div className="p-4">
          <div className="flex h-40 items-end justify-between gap-3">
            {buckets.map(b => (
              <div key={b.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">{b.total > 0 ? short(b.total) : ''}</span>
                <div className={cn('w-full rounded-t-md transition-all', b.total > 0 ? 'bg-indigo-500 hover:bg-indigo-600' : 'h-1 bg-muted')} style={{ height: b.total > 0 ? `${Math.max(Math.round((b.total / max) * 100), 6)}%` : undefined }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3 border-t pt-2">
            {buckets.map(b => (
              <span key={b.key} className="flex-1 truncate text-center text-[10px] font-medium text-muted-foreground">{b.label}</span>
            ))}
          </div>
        </div>
      )}
    </WidgetCard>
  )
}

function ProjectMilestonesWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['projectmilestones', 'all'],
    queryFn: () => api.listAll('projectmilestones'),
  })
  const records = (data?.data || [])
  const upcoming = records
    .filter(r => r.milestoneDate)
    .sort((a: any, b: any) => new Date(a.milestoneDate).getTime() - new Date(b.milestoneDate).getTime())
    .slice(0, 6)
  const completed = records.filter(r => (r.status || '').toLowerCase().includes('complete') || r.progress === 100).length
  const inProgress = records.filter(r => !(r.status || '').toLowerCase().includes('complete') && r.progress > 0 && r.progress < 100).length

  const statusClass = (s: string) => {
    const low = (s || '').toLowerCase()
    if (low.includes('complete')) return 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400'
    if (low.includes('progress')) return 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
    if (low.includes('overdue')) return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
    return 'bg-muted text-muted-foreground'
  }

  return (
    <WidgetCard title="Projects & Milestones" icon={FolderKanban} tint="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
      {isLoading ? <WidgetEmpty label="Loading..." /> : records.length === 0 ? <WidgetEmpty label="No milestones yet" /> : (
        <div>
          <div className="grid grid-cols-3 gap-2 p-4 pb-0">
            <div className="rounded-lg bg-muted p-2 text-center">
              <p className="text-lg font-bold tabular-nums">{records.length}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t('Total')}</p>
            </div>
            <div className="rounded-lg bg-muted p-2 text-center">
              <p className="text-lg font-bold tabular-nums">{inProgress}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t('In progress')}</p>
            </div>
            <div className="rounded-lg bg-muted p-2 text-center">
              <p className="text-lg font-bold tabular-nums">{completed}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t('Completed')}</p>
            </div>
          </div>
          <div className="space-y-3 p-4 pt-3">
            {upcoming.map((r: any) => (
              <div key={r.id}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <Link to={`/projectmilestones/${r.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">{r.title}</Link>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', statusClass(r.status))}>{r.status || '—'}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${r.progress || 0}%` }} />
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">{r.progress || 0}%</span>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{r.milestoneDate ? formatDateTime(r.milestoneDate) : t('No due date')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetCard>
  )
}

function RecentLeadsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['leads', 'recent'],
    queryFn: () => api.list('leads', { limit: '5', sortBy: 'createdAt', sortOrder: 'desc' }),
  })
  const rows = data?.data || []

  return (
    <WidgetCard title="Recent Leads" icon={User} tint="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
      {isLoading ? <WidgetEmpty label="Loading..." /> : rows.length === 0 ? <WidgetEmpty label="No leads yet" /> : rows.slice(0, 5).map((r: any) => (
        <WidgetRow key={r.id} to={`/leads/${r.id}`} primary={[r.firstName, r.lastName].filter(Boolean).join(' ') || r.email || 'Lead'} secondary={[r.company, r.leadStatus].filter(Boolean).join(' · ')} />
      ))}
    </WidgetCard>
  )
}

function LeadsByStatusWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['leads', 'status'],
    queryFn: () => api.listAll('leads'),
  })
  const records = (data?.data || [])
  const groups = new Map<string, number>()
  for (const r of records) {
    const k = r.leadStatus || 'Unassigned'
    groups.set(k, (groups.get(k) || 0) + 1)
  }
  const rows = [...groups.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  const max = Math.max(...rows.map(r => r[1]), 1)

  return (
    <WidgetCard title="Leads by Status" icon={PieChart} tint="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
      {isLoading ? <WidgetEmpty label="Loading..." /> : records.length === 0 ? <WidgetEmpty label="No leads yet" /> : (
        <div className="space-y-3 p-4">
          {rows.map(([status, count]) => (
            <div key={status}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="truncate font-medium">{status}</span>
                <span className="text-muted-foreground tabular-nums">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.round((count / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  )
}

function UpcomingActivitiesWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['calendar', 'upcoming'],
    queryFn: () => api.getUpcomingActivities(5),
  })
  const items = data?.data || []

  return (
    <WidgetCard title="Upcoming Activities" icon={CalendarDays} tint="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
      {isLoading ? <WidgetEmpty label="Loading..." /> : items.length === 0 ? <WidgetEmpty label="No upcoming activities" /> : items.map((r: any) => (
        <WidgetRow key={r.id} to="/calendar" primary={r.subject} secondary={r.dueAt || r.startAt ? formatDateTime(r.dueAt || r.startAt) : ''} />
      ))}
    </WidgetCard>
  )
}
