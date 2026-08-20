import { useEffect, useState, useCallback, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Building2, Users, UserPlus, TrendingUp, LifeBuoy, Package, FolderKanban, Receipt, CalendarDays, Filter, PlusCircle, LayoutDashboard, Check, RotateCcw, Save, BarChart3, PieChart, ListTodo, Ticket, User, GripVertical, Activity, Target, Clock, DollarSign, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Zap, Star, Sparkles, X, Eye, EyeOff, ChevronDown, AlertCircle, CheckCircle2, Clock3, FolderOpen, Mail, UserCheck, Megaphone, BriefcaseBusiness, ShieldCheck } from 'lucide-react'
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

type WidgetKey = string

const WIDGETS: { key: WidgetKey; label: string; icon: React.ElementType; tint?: string; tile?: string; span: string; module: string | null; render: () => React.ReactNode }[] = [
  { key: 'revenueOverview', label: 'Revenue overview', icon: DollarSign, tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', span: 'md:col-span-2 xl:col-span-4', module: null, render: () => <RevenueOverviewWidget /> },
  { key: 'pipelineFunnel', label: 'Sales pipeline funnel', icon: Filter, tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', span: 'xl:col-span-2', module: 'potentials', render: () => <PipelineFunnelWidget /> },
  { key: 'activityFeed', label: 'Activity feed', icon: Activity, tint: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400', span: 'xl:col-span-1', module: null, render: () => <ActivityFeedWidget /> },
  { key: 'leadSources', label: 'Lead sources', icon: PieChart, tint: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400', span: 'xl:col-span-1', module: 'leads', render: () => <LeadSourcesWidget /> },
  { key: 'ticketStats', label: 'Ticket overview', icon: Ticket, tint: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400', span: 'xl:col-span-1', module: 'tickets', render: () => <TicketStatsWidget /> },
  { key: 'kpiCards', label: 'KPI cards', icon: Target, tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', span: 'md:col-span-2 xl:col-span-2', module: null, render: () => <KpiCardsWidget /> },
  { key: 'statAccounts', label: 'Accounts count', icon: Building2, tile: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', span: '', module: 'accounts', render: () => <StatCardWidget module="accounts" label="Accounts" icon={Building2} tile="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" /> },
  { key: 'statContacts', label: 'Contacts count', icon: Users, tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', span: '', module: 'contacts', render: () => <StatCardWidget module="contacts" label="Contacts" icon={Users} tile="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" /> },
  { key: 'statLeads', label: 'Leads count', icon: UserPlus, tile: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400', span: '', module: 'leads', render: () => <StatCardWidget module="leads" label="Leads" icon={UserPlus} tile="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" /> },
  { key: 'statPotentials', label: 'Opportunities count', icon: TrendingUp, tile: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', span: '', module: 'potentials', render: () => <StatCardWidget module="potentials" label="Opportunities" icon={TrendingUp} tile="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" /> },
  { key: 'statTickets', label: 'Tickets count', icon: LifeBuoy, tile: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400', span: '', module: 'tickets', render: () => <StatCardWidget module="tickets" label="Tickets" icon={LifeBuoy} tile="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" /> },
  { key: 'statProducts', label: 'Products count', icon: Package, tile: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400', span: '', module: 'products', render: () => <StatCardWidget module="products" label="Products" icon={Package} tile="bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400" /> },
  { key: 'statProjects', label: 'Projects count', icon: FolderKanban, tile: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400', span: '', module: 'projects', render: () => <StatCardWidget module="projects" label="Projects" icon={FolderKanban} tile="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" /> },
  { key: 'statInvoices', label: 'Invoices count', icon: Receipt, tile: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400', span: '', module: 'invoices', render: () => <StatCardWidget module="invoices" label="Invoices" icon={Receipt} tile="bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400" /> },
  { key: 'salesByMonth', label: 'Sales by month', icon: BarChart3, tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', span: 'xl:col-span-2', module: 'potentials', render: () => <SalesByMonthWidget /> },
  { key: 'salesFunnel', label: 'Sales funnel', icon: Filter, tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', span: '', module: 'potentials', render: () => <SalesFunnelWidget /> },
  { key: 'pipelineChart', label: 'Pipeline by stage', icon: BarChart3, tint: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400', span: '', module: 'potentials', render: () => <PipelineChartWidget /> },
  { key: 'revenueTrend', label: 'Revenue trend', icon: DollarSign, tint: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400', span: '', module: 'invoices', render: () => <RevenueTrendWidget /> },
  { key: 'projectMilestones', label: 'Projects & milestones', icon: FolderKanban, tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', span: '', module: 'projectmilestones', render: () => <ProjectMilestonesWidget /> },
  { key: 'recentLeads', label: 'Recent leads', icon: User, tint: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400', span: '', module: 'leads', render: () => <RecentLeadsWidget /> },
  { key: 'leadsByStatus', label: 'Leads by status', icon: PieChart, tint: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400', span: '', module: 'leads', render: () => <LeadsByStatusWidget /> },
  { key: 'upcoming', label: 'Upcoming activities', icon: CalendarDays, tint: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400', span: '', module: null, render: () => <UpcomingActivitiesWidget /> },
  { key: 'upcomingFollowUps', label: 'Upcoming follow-ups', icon: Clock, tint: 'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400', span: '', module: 'potentials', render: () => <UpcomingFollowUpsWidget /> },
  { key: 'openPotentials', label: 'My open opportunities', icon: TrendingUp, tint: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400', span: '', module: 'potentials', render: () => <OpenOpportunitiesWidget /> },
  { key: 'openTickets', label: 'My open tickets', icon: LifeBuoy, tint: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400', span: '', module: 'tickets', render: () => <OpenTicketsWidget /> },
  { key: 'ticketsByPriority', label: 'Tickets by priority', icon: Ticket, tint: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400', span: '', module: 'tickets', render: () => <TicketsByPriorityWidget /> },
  { key: 'aiInsights', label: 'AI Insights', icon: Sparkles, tint: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400', span: 'md:col-span-2 xl:col-span-2', module: null, render: () => <AiInsightsWidget /> },
  { key: 'assignedToMe', label: 'Assigned to me', icon: UserCheck, tint: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400', span: 'md:col-span-2 xl:col-span-2', module: null, render: () => <AssignedToMeWidget /> },
  { key: 'recentPotentials', label: 'Recent opportunities', icon: ListTodo, tint: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400', span: '', module: 'potentials', render: () => <RecentWidget module="potentials" title="Recent Opportunities" primary="potentialName" secondary={['stage', 'amount']} icon={TrendingUp} tint="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" empty="No opportunities yet" /> },
  { key: 'recentTickets', label: 'Recent tickets', icon: Ticket, tint: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400', span: '', module: 'tickets', render: () => <RecentWidget module="tickets" title="Recent Tickets" primary="title" secondary={['status', 'priority']} icon={LifeBuoy} tint="bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400" empty="No tickets yet" /> },
]

const WIDGET_KEYS = WIDGETS.map(w => w.key)
const DEFAULT_ORDER: string[] = [
  'assignedToMe', 'upcoming', 'openPotentials', 'openTickets', 'upcomingFollowUps',
  'recentLeads', 'recentPotentials', 'recentTickets', 'aiInsights', 'revenueOverview',
  'pipelineFunnel', 'salesByMonth', 'ticketStats', 'projectMilestones',
]

const PERSONAL_WIDGETS = new Set(['assignedToMe', 'upcoming', 'openPotentials', 'openTickets', 'upcomingFollowUps', 'recentLeads', 'recentPotentials', 'recentTickets', 'aiInsights'])
const SALES_WIDGETS = new Set(['openPotentials', 'upcomingFollowUps', 'recentLeads', 'recentPotentials', 'salesFunnel', 'pipelineChart', 'leadSources', 'leadsByStatus'])
const SERVICE_WIDGETS = new Set(['assignedToMe', 'openTickets', 'recentTickets', 'ticketStats', 'ticketsByPriority', 'projectMilestones'])

function resolveConfig(saved: any): { order: string[]; hidden: string[] } {
  const order: string[] = Array.isArray(saved?.order) ? saved.order.filter((k: any) => WIDGET_KEYS.includes(k)) : []
  const hidden: string[] = Array.isArray(saved?.hidden) ? saved.hidden.filter((k: any) => WIDGET_KEYS.includes(k)) : []
  return { order: order.length ? order : [...DEFAULT_ORDER], hidden }
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
  const [order, setOrder] = useState<string[] | null>(null)
  const [hidden, setHidden] = useState<string[]>([])
  const [editing, setEditing] = useState(false)
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [overKey, setOverKey] = useState<string | null>(null)
  const [showCustomize, setShowCustomize] = useState(false)
  const [dashboardTab, setDashboardTab] = useState<'workspace' | 'sales' | 'service' | 'notices' | 'admin'>('workspace')
  const dragRef = useRef<string | null>(null)

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
      setShowCustomize(false)
      setDragKey(null)
      setOverKey(null)
    },
  })

  const dismissCard = useCallback((key: string) => {
    setHidden(h => [...h, key])
  }, [])

  const showCard = useCallback((key: string) => {
    setHidden(h => h.filter(k => k !== key))
    setOrder(o => {
      const cur = o ? [...o] : []
      if (!cur.includes(key)) cur.push(key)
      return cur
    })
  }, [])

  const toggleVisible = useCallback((key: string) => {
    setHidden(h => h.includes(key) ? h.filter(k => k !== key) : [...h, key])
  }, [])

  const reorderFull = (from: string, to: string) => {
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

  const persistOrder = (nextOrder: string[]) => {
    api.updateDashboardConfig({ order: nextOrder, hidden }).catch(() => {})
    queryClient.invalidateQueries({ queryKey: ['dashboard-config'] })
  }

  const moveCard = (from: string, to: string) => {
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

  const clearDrag = () => { setDragKey(null); setOverKey(null); dragRef.current = null }

  const effectiveOrder = order ?? [...DEFAULT_ORDER]
  const canViewWidget = (module: string | null) => !module || viewable.has(module)
  const allWidgets = effectiveOrder
    .filter(key => !hidden.includes(key))
    .map(key => WIDGETS.find(w => w.key === key))
    .filter((w): w is (typeof WIDGETS)[number] => Boolean(w))
    .filter(w => canViewWidget(w.module))

  const widgets = allWidgets.filter(widget => {
    if (dashboardTab === 'workspace') return PERSONAL_WIDGETS.has(widget.key)
    if (dashboardTab === 'sales') return SALES_WIDGETS.has(widget.key)
    if (dashboardTab === 'service') return SERVICE_WIDGETS.has(widget.key)
    if (dashboardTab === 'admin') return !!user?.isAdmin && !PERSONAL_WIDGETS.has(widget.key)
    return false
  })

  const visibleQuickActions = quickActions.filter(a => viewable.has(a.module))

  const hiddenWidgets = WIDGETS
    .filter(w => (!effectiveOrder.includes(w.key) || hidden.includes(w.key)) && canViewWidget(w.module))

  return (
    <div className="space-y-4">
      {/* Welcome header */}
      <Card className="border-0 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{t('Welcome back, {name}', { name })}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{today}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {visibleQuickActions.map(a => (
                <Link key={a.to} to={a.to} className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground shadow-sm">
                  <PlusCircle size={13} /> {t(a.label)}
                </Link>
              ))}
              {dashboardTab !== 'notices' && <button
                type="button"
                onClick={() => setShowCustomize(v => !v)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all shadow-sm',
                  showCustomize ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <LayoutDashboard size={13} /> {showCustomize ? t('Done') : t('Customize')}
              </button>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1 shadow-sm">
        {[
          { key: 'workspace', label: 'My Workspace', icon: BriefcaseBusiness },
          { key: 'sales', label: 'My Sales', icon: TrendingUp },
          { key: 'service', label: 'Service & Tasks', icon: LifeBuoy },
          { key: 'notices', label: 'Notice Board', icon: Megaphone },
          ...(user?.isAdmin ? [{ key: 'admin', label: 'Organization Overview', icon: ShieldCheck }] : []),
        ].map(tab => (
          <button key={tab.key} type="button" onClick={() => { setDashboardTab(tab.key as any); setShowCustomize(false) }} className={cn(
            'inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            dashboardTab === tab.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}>
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Customize Panel — slide down */}
      {showCustomize && dashboardTab !== 'notices' && (
        <Card className="border-indigo-200 dark:border-indigo-900 shadow-md animate-in slide-in-from-top-2 duration-200">
          <CardContent className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold flex items-center gap-2"><LayoutDashboard size={15} /> {t('Customize Dashboard')}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{t('Drag to reorder, toggle visibility, or dismiss cards with the × button.')}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setOrder([...DEFAULT_ORDER]); setHidden([]) }}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                >
                  <RotateCcw size={13} /> {t('Reset')}
                </button>
                <button
                  type="button"
                  onClick={() => save.mutate()}
                  disabled={save.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                >
                  <Save size={13} /> {save.isPending ? t('Saving...') : t('Save')}
                </button>
              </div>
            </div>

            {/* Active widgets */}
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t('Active Widgets')}</p>
              <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
                {effectiveOrder.filter(k => canViewWidget(WIDGETS.find(x => x.key === k)?.module || null)).map((key) => {
                  const w = WIDGETS.find(x => x.key === key)
                  if (!w) return null
                  const isHidden = hidden.includes(key)
                  const Icon = w.icon
                  return (
                    <div
                      key={key}
                      draggable
                      onDragStart={(e) => { dragRef.current = key; setDragKey(key); e.dataTransfer.effectAllowed = 'move' }}
                      onDragOver={(e) => { e.preventDefault(); if (overKey !== key) setOverKey(key) }}
                      onDrop={(e) => { e.preventDefault(); reorderFull(dragRef.current || key, key) }}
                      onDragEnd={clearDrag}
                      className={cn(
                        'flex cursor-grab items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2 active:cursor-grabbing transition-all',
                        isHidden && 'opacity-40',
                        overKey === key && dragKey !== key && 'ring-2 ring-indigo-400 bg-indigo-50 dark:bg-indigo-950'
                      )}
                    >
                      <span className="text-muted-foreground/50"><GripVertical size={14} /></span>
                      <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded', w.tint)}>
                        <Icon size={12} />
                      </span>
                      <span className="flex-1 truncate text-xs font-medium">{t(w.label)}</span>
                      <button
                        type="button"
                        onClick={() => toggleVisible(key)}
                        className={cn(
                          'rounded-full p-1 transition-colors',
                          isHidden ? 'text-muted-foreground hover:bg-muted' : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950'
                        )}
                        title={isHidden ? t('Show') : t('Hide')}
                      >
                        {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Hidden widgets — quick re-add */}
            {hiddenWidgets.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t('Hidden Widgets — Click to Show')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {hiddenWidgets.map(w => {
                    const Icon = w.icon
                    return (
                      <button
                        key={w.key}
                        type="button"
                        onClick={() => showCard(w.key)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-dashed bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                      >
                        <PlusCircle size={12} /> {t(w.label)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {dashboardTab === 'notices' ? <NoticeBoard isAdmin={!!user?.isAdmin} /> : <>
      {/* Dashboard cards grid */}
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        onClickCapture={editing ? (e) => {
          const a = (e.target as HTMLElement).closest('a')
          if (a) { e.preventDefault(); e.stopPropagation() }
        } : undefined}
      >
        {widgets.map((w, idx) => (
          <div
            key={w.key}
            draggable
            onDragStart={(e) => { dragRef.current = w.key; setDragKey(w.key); e.dataTransfer.effectAllowed = 'move' }}
            onDragOver={(e) => { e.preventDefault(); if (overKey !== w.key) setOverKey(w.key) }}
            onDrop={(e) => { e.preventDefault(); moveCard(dragRef.current || w.key, w.key) }}
            onDragEnd={clearDrag}
            className={cn(
              'content-start relative group rounded-xl transition-all',
              w.span,
              'cursor-grab active:cursor-grabbing',
              'bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800',
              'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700',
              dragKey === w.key && 'opacity-40 scale-95',
              overKey === w.key && dragKey !== w.key && 'ring-2 ring-indigo-400 border-indigo-300'
            )}
          >
            {/* Dismiss button — always visible */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); dismissCard(w.key) }}
              className="absolute top-2 right-2 z-20 rounded-full bg-white/80 dark:bg-slate-800/80 p-1 text-muted-foreground/50 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 shadow-sm"
              title={t('Dismiss')}
            >
              <X size={14} />
            </button>

            {/* Drag handle indicator */}
            <span className="pointer-events-none absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-muted/60 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              <GripVertical size={10} />
            </span>

            {w.render()}
          </div>
        ))}
      </div>

      {widgets.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-12 text-center">
          <LayoutDashboard size={36} className="mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-base font-semibold text-foreground/70">{t('Your dashboard is empty')}</p>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-md mx-auto">{t('Click the button below to add widgets and personalize your dashboard.')}</p>
          <button
            type="button"
            onClick={() => setShowCustomize(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <LayoutDashboard size={15} /> {t('Customize Dashboard')}
          </button>
        </div>
      )}
      </>}
    </div>
  )
}

function NoticeBoard({ isAdmin }: { isAdmin: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ['announcements-active'],
    queryFn: () => api.getActiveAnnouncements(),
  })
  const notices = data?.data || []

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <Card className="overflow-hidden">
        <div className="border-b bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 dark:from-amber-950/30 dark:to-orange-950/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-semibold"><Megaphone size={17} className="text-amber-600" /> Organization Notice Board</h2>
              <p className="mt-1 text-xs text-muted-foreground">Announcements shared with everyone in your organization.</p>
            </div>
            {isAdmin && <Link to="/settings" className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">Manage notices</Link>}
          </div>
        </div>
        <CardContent className="p-0">
          {isLoading ? <div className="p-10 text-center text-sm text-muted-foreground">Loading notices…</div> : notices.length === 0 ? (
            <div className="p-12 text-center">
              <Megaphone size={34} className="mx-auto text-muted-foreground/30" />
              <p className="mt-3 font-medium">No active notices</p>
              <p className="mt-1 text-sm text-muted-foreground">Important organization updates will appear here.</p>
            </div>
          ) : <div className="divide-y">
            {notices.map((notice: any) => (
              <article key={notice.id} className="p-5 transition-colors hover:bg-muted/20">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><Megaphone size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{notice.title}</h3>
                    {notice.message && <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{notice.message}</p>}
                    <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      {notice.startsAt && <span>Published {formatDateTime(notice.startsAt)}</span>}
                      {notice.expiresAt && <span>Expires {formatDateTime(notice.expiresAt)}</span>}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>}
        </CardContent>
      </Card>
      <Card className="h-fit">
        <CardContent className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Board summary</p>
          <p className="mt-2 text-3xl font-bold">{notices.length}</p>
          <p className="text-sm text-muted-foreground">active {notices.length === 1 ? 'announcement' : 'announcements'}</p>
          <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">Notices are isolated to your organization and managed by organization administrators.</div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── KPI Top Cards ─────────────────────────────────────────────────────────

function RevenueOverviewWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => fetch('/api/dashboard/kpis', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
  })
  const kpis = data?.data || {}
  const revenue = kpis.revenue || {}
  const pipeline = kpis.pipeline || {}
  const leads = kpis.leads || {}
  const tickets = kpis.tickets || {}

  const cards = [
    {
      label: 'Total Revenue', value: fmtMoney(revenue.total), sub: `MRR: ${fmtMoney(revenue.mrr)}`,
      icon: DollarSign, color: 'from-emerald-500 to-emerald-600', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      trend: revenue.growth, trendLabel: 'vs last month',
    },
    {
      label: 'Pipeline Value', value: fmtMoney(pipeline.value), sub: `${pipeline.openCount || 0} open deals`,
      icon: Target, color: 'from-blue-500 to-blue-600', iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      trend: null,
    },
    {
      label: 'New Leads', value: String(leads.new || 0), sub: `${leads.conversionRate || 0}% conversion rate`,
      icon: UserPlus, color: 'from-violet-500 to-violet-600', iconBg: 'bg-violet-100 dark:bg-violet-900/40',
      trend: null,
    },
    {
      label: 'Open Tickets', value: String(tickets.open || 0), sub: `${tickets.resolutionRate || 0}% resolution rate`,
      icon: LifeBuoy, color: 'from-rose-500 to-rose-600', iconBg: 'bg-rose-100 dark:bg-rose-900/40',
      trend: null,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{c.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums leading-tight">{isLoading ? '—' : c.value}</p>
                {c.sub && <p className="mt-0.5 text-xs text-muted-foreground truncate">{c.sub}</p>}
              </div>
              <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', c.iconBg)}>
                <c.icon size={18} className="text-slate-700 dark:text-slate-200" />
              </div>
            </div>
            {c.trend != null && (
              <div className="mt-2 flex items-center gap-1">
                {c.trend >= 0 ? (
                  <ArrowUpRight size={14} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ArrowDownRight size={14} className="text-red-600 dark:text-red-400" />
                )}
                <span className={cn('text-xs font-semibold', c.trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                  {Math.abs(c.trend)}%
                </span>
                {c.trendLabel && <span className="text-[10px] text-muted-foreground">{c.trendLabel}</span>}
              </div>
            )}
          </CardContent>
          <div className={cn('h-1 bg-gradient-to-r', c.color)} />
        </Card>
      ))}
    </div>
  )
}

function PipelineFunnelWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => fetch('/api/dashboard/kpis', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
  })
  const stages = data?.data?.pipeline?.stages || []
  const totalValue = stages.reduce((s: number, st: any) => s + st.value, 0)
  const maxCount = Math.max(...stages.map((s: any) => s.count), 1)
  const funnelColors = ['bg-violet-500', 'bg-blue-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-emerald-600']

  return (
    <WidgetCard title="Sales Pipeline" icon={Filter} tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
      {isLoading ? <WidgetEmpty label="Loading..." /> : stages.length === 0 ? <WidgetEmpty label="No pipeline data" /> : (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-muted-foreground">Total pipeline value</span>
            <span className="text-sm font-bold tabular-nums">{fmtMoney(totalValue)}</span>
          </div>
          <div className="space-y-3">
            {stages.map((s: any, idx: number) => (
              <div key={s.name} className="relative">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium truncate pr-2">{s.name}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">{s.count} · {fmtMoney(s.value)}</span>
                </div>
                <div className="h-8 overflow-hidden rounded-md bg-muted/60">
                  <div
                    className={cn('h-full rounded-md transition-all flex items-center justify-end pr-2', funnelColors[idx % funnelColors.length])}
                    style={{ width: `${Math.max(Math.round((s.count / maxCount) * 100), 8)}%`, opacity: 0.85 }}
                  >
                    <span className="text-[10px] font-bold text-white">{s.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetCard>
  )
}

// ─── Activity Feed ──────────────────────────────────────────────────────────

function ActivityFeedWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => fetch('/api/dashboard/kpis', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
  })
  const items = data?.data?.activity || []

  const actionIcon = (action: string) => {
    const a = (action || '').toLowerCase()
    if (a === 'create') return <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
    if (a === 'update' || a === 'stage') return <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
    if (a === 'delete') return <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
    if (a === 'convert') return <span className="inline-block w-2 h-2 rounded-full bg-violet-500" />
    return <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" />
  }

  return (
    <WidgetCard title="Recent Activity" icon={Activity} tint="bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400">
      {isLoading ? <WidgetEmpty label="Loading..." /> : items.length === 0 ? <WidgetEmpty label="No recent activity" /> : (
        <div className="max-h-80 overflow-y-auto">
          {items.slice(0, 10).map((item: any) => (
            <div key={item.id} className="flex items-start gap-2.5 border-b px-4 py-2.5 last:border-0 hover:bg-accent/30 transition-colors">
              <div className="mt-1.5 shrink-0">{actionIcon(item.action)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{item.module} — {item.action}</p>
                {item.description && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.description}</p>}
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">{item.timestamp ? formatDateTime(item.timestamp) : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  )
}

// ─── Lead Sources Pie Chart (CSS) ──────────────────────────────────────────

function LeadSourcesWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => fetch('/api/dashboard/kpis', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
  })
  const sources = data?.data?.leads?.topSources || []
  const total = sources.reduce((s: number, src: any) => s + src.count, 0)
  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500']

  // Build CSS pie chart segments
  let cumulativeDeg = 0
  const segments = sources.map((src: any, idx: number) => {
    const deg = total > 0 ? (src.count / total) * 360 : 0
    const start = cumulativeDeg
    cumulativeDeg += deg
    return { ...src, start, deg, color: colors[idx % colors.length] }
  })

  return (
    <WidgetCard title="Lead Sources" icon={PieChart} tint="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
      {isLoading ? <WidgetEmpty label="Loading..." /> : sources.length === 0 ? <WidgetEmpty label="No lead sources data" /> : (
        <div className="p-4">
          <div className="flex items-center gap-6">
            {/* CSS conic-gradient pie chart */}
            <div className="relative h-28 w-28 shrink-0">
              <div
                className="h-full w-full rounded-full"
                style={{
                  background: `conic-gradient(${segments.map((s: any) => `${s.color.replace('bg-', '').replace('-500', '') === 'violet' ? '#8b5cf6' : s.color.includes('blue') ? '#3b82f6' : s.color.includes('emerald') ? '#10b981' : s.color.includes('amber') ? '#f59e0b' : s.color.includes('rose') ? '#f43f5e' : '#06b6d4'} ${s.start}deg ${s.start + s.deg}deg`).join(', ')})`,
                }}
              />
              <div className="absolute inset-3 rounded-full bg-card" />
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-lg font-bold tabular-nums">{total}</span>
              </div>
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              {segments.map((s: any, idx: number) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', s.color)} />
                  <span className="text-xs font-medium truncate flex-1">{s.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </WidgetCard>
  )
}

// ─── Ticket Overview Stats ──────────────────────────────────────────────────

function TicketStatsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => fetch('/api/dashboard/kpis', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
  })
  const tickets = data?.data?.tickets || {}

  return (
    <WidgetCard title="Ticket Overview" icon={Ticket} tint="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
      {isLoading ? <WidgetEmpty label="Loading..." /> : (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">{tickets.open || 0}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mt-0.5">Open</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{tickets.total || 0}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mt-0.5">Total</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{tickets.avgResponseTime || 0}h</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mt-0.5">Avg Response</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{tickets.resolutionRate || 0}%</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mt-0.5">Resolution</p>
            </div>
          </div>
        </div>
      )}
    </WidgetCard>
  )
}

// ─── Shared widget components ──────────────────────────────────────────────

function StatCardWidget({ module, label, icon: Icon, tile }: { module: string; label: string; icon: React.ElementType; tile: string }) {
  const { data } = useQuery({
    queryKey: [module, 'count'],
    queryFn: () => api.list(module, { limit: '1' }),
  })
  const total = data?.pagination?.total ?? 0

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
              <p className="mt-0.5 text-2xl font-semibold tabular-nums leading-tight">{total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function WidgetCard({ title, icon: Icon, tint, children }: { title: string; icon: React.ElementType; tint: string; children: React.ReactNode }) {
  return (
    <Card className="h-full overflow-hidden border-0 shadow-none bg-transparent">
      <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-700/50 px-4 py-3">
        <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg', tint)}>
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
  if (v == null || v === '') return '$0'
  const n = Number(v)
  if (isNaN(n)) return '$0'
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
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

function KpiCardsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => fetch('/api/dashboard/kpis', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
  })
  const kpis = data?.data || {}

  const kpiItems = [
    { label: 'Win Rate', value: kpis.winRate != null ? `${kpis.winRate}%` : '—', icon: Target, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Avg Sales Cycle', value: kpis.avgCycleLength != null ? `${kpis.avgCycleLength} days` : '—', icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Revenue / User', value: fmtMoney(kpis.revenuePerUser), icon: Users, color: 'text-violet-600 dark:text-violet-400' },
    { label: 'Won Deals (YTD)', value: String(kpis.totalWonDeals ?? '—'), icon: TrendingUp, color: 'text-teal-600 dark:text-teal-400' },
    { label: 'Avg Ticket Resolution', value: kpis.avgResolutionTime != null ? `${kpis.avgResolutionTime}h` : '—', icon: LifeBuoy, color: 'text-rose-600 dark:text-rose-400' },
  ]

  return (
    <WidgetCard title="Key Performance Indicators" icon={Target} tint="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
      {isLoading ? <WidgetEmpty label="Loading..." /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
          {kpiItems.map((kpi) => (
            <div key={kpi.label} className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon size={14} className={kpi.color} />
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground truncate">{kpi.label}</span>
              </div>
              <p className="text-xl font-bold tabular-nums">{isLoading ? '—' : kpi.value}</p>
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  )
}

function PipelineChartWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'pipeline'],
    queryFn: () => fetch('/api/dashboard/pipeline', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
  })
  const stages = data?.data?.stages || []
  const total = data?.data?.totalPipeline || 0
  const max = Math.max(...stages.map((s: any) => s.amount), 1)

  return (
    <WidgetCard title="Pipeline by Stage" icon={BarChart3} tint="bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
      {isLoading ? <WidgetEmpty label="Loading..." /> : stages.length === 0 ? <WidgetEmpty label="No pipeline data" /> : (
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">{t('Total pipeline')}</span>
            <span className="font-bold tabular-nums">{fmtMoney(total)}</span>
          </div>
          {stages.map((s: any) => (
            <div key={s.stage}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium truncate">{s.stage}</span>
                <span className="text-muted-foreground shrink-0 ml-2">{s.count} · {fmtMoney(s.amount)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${Math.round((s.amount / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  )
}

function RevenueTrendWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
  })
  const stats = data?.data || {}
  const months = [
    { label: 'This Month', value: stats.revenueMonth || 0, color: 'bg-emerald-500' },
    { label: 'This Quarter', value: stats.revenueQuarter || 0, color: 'bg-blue-500' },
    { label: 'This Year', value: stats.revenueYear || 0, color: 'bg-indigo-500' },
  ]
  const maxVal = Math.max(...months.map(m => m.value), 1)

  return (
    <WidgetCard title="Revenue Trend" icon={DollarSign} tint="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
      {isLoading ? <WidgetEmpty label="Loading..." /> : (
        <div className="p-4 space-y-4">
          {months.map(m => (
            <div key={m.label}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">{m.label}</span>
                <span className="font-bold tabular-nums">{fmtMoney(m.value)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full transition-all', m.color)} style={{ width: `${Math.max(Math.round((m.value / maxVal) * 100), 2)}%` }} />
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums">{fmtMoney(stats.closedWonMonth)}</p>
              <p className="text-[10px] text-muted-foreground">Won This Month</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums">{fmtMoney(stats.closedWonQuarter)}</p>
              <p className="text-[10px] text-muted-foreground">Won This Quarter</p>
            </div>
          </div>
        </div>
      )}
    </WidgetCard>
  )
}

function TicketsByPriorityWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['tickets', 'priority'],
    queryFn: () => api.listAll('tickets'),
  })
  const records = (data?.data || []).filter((r: any) => !['Closed', 'Resolved'].includes(r.status || ''))
  const groups = new Map<string, number>()
  for (const r of records) {
    const k = r.priority || 'Unassigned'
    groups.set(k, (groups.get(k) || 0) + 1)
  }
  const rows = [...groups.entries()].sort((a, b) => b[1] - a[1])
  const max = Math.max(...rows.map(r => r[1]), 1)
  const colors: Record<string, string> = { Critical: 'bg-red-500', High: 'bg-orange-500', Normal: 'bg-blue-500', Low: 'bg-green-500' }

  return (
    <WidgetCard title="Open Tickets by Priority" icon={Ticket} tint="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
      {isLoading ? <WidgetEmpty label="Loading..." /> : rows.length === 0 ? <WidgetEmpty label="No open tickets" /> : (
        <div className="space-y-3 p-4">
          {rows.map(([priority, count]) => (
            <div key={priority}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{priority}</span>
                <span className="text-muted-foreground tabular-nums">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((count / max) * 100)}%`, backgroundColor: colors[priority] || '#6366f1' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  )
}

function UpcomingFollowUpsWidget() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['potentials', 'followUps'],
    queryFn: () => api.list('potentials', { filter: JSON.stringify({ nextFollowUp: { not: null }, stage: { notIn: ['Closed Won', 'Closed Lost'] } }), limit: '5', sortBy: 'nextFollowUp', sortOrder: 'asc' }),
  })
  const items = (data?.data || []).filter((r: any) => r.nextFollowUp)

  return (
    <WidgetCard title="Upcoming Follow-ups" icon={Clock} tint="bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400">
      {isLoading ? <WidgetEmpty label="Loading..." /> : items.length === 0 ? <WidgetEmpty label="No follow-ups scheduled" /> : items.map((r: any) => (
        <WidgetRow key={r.id} to={`/potentials/${r.id}`} primary={r.potentialName} secondary={[formatDateTime(r.nextFollowUp), fmtMoney(r.amount)].filter(Boolean).join(' · ')} />
      ))}
    </WidgetCard>
  )
}

function AiInsightsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => fetch('/api/ai/insights', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()).catch(() => ({ data: {} })),
  })
  const insights = data?.data || {}
  const summary = insights.summary || {}
  const staleLeads = insights.staleLeads || []
  const topOpps = insights.topOpportunities || []

  return (
    <WidgetCard title="AI Insights" icon={Sparkles} tint="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
      {isLoading ? (
        <WidgetEmpty label="Loading..." />
      ) : (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
              <p className="text-lg font-bold tabular-nums">{summary.totalOpenOpps || 0}</p>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">Open Opps</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
              <p className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400">{summary.staleLeadCount || 0}</p>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">Stale Leads</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
              <p className="text-lg font-bold tabular-nums">{summary.openTicketCount || 0}</p>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">Open Tickets</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
              <p className="text-lg font-bold tabular-nums text-orange-600 dark:text-orange-400">{summary.overdueActions || 0}</p>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">Overdue</p>
            </div>
          </div>

          {topOpps.length > 0 && (
            <div>
              <p className="text-[10px] font-medium uppercase text-muted-foreground mb-1.5">Top Opportunities</p>
              <div className="space-y-1">
                {topOpps.slice(0, 3).map((o: any) => (
                  <Link key={o.id} to={`/potentials/${o.id}`} className="flex items-center justify-between rounded-lg border p-2 hover:bg-accent/30 transition-colors">
                    <span className="text-xs font-medium truncate">{o.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{fmtMoney(o.amount)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {staleLeads.length > 0 && (
            <div>
              <p className="text-[10px] font-medium uppercase text-muted-foreground mb-1.5">At-Risk Leads</p>
              <div className="space-y-1">
                {staleLeads.slice(0, 3).map((l: any) => (
                  <Link key={l.id} to={`/leads/${l.id}`} className="flex items-center justify-between rounded-lg border p-2 hover:bg-accent/30 transition-colors">
                    <span className="text-xs font-medium truncate">{l.name}</span>
                    <span className="text-[10px] text-red-600 dark:text-red-400 shrink-0 ml-2">{l.daysStale}d stale</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {topOpps.length === 0 && staleLeads.length === 0 && summary.totalOpenOpps === 0 && (
            <WidgetEmpty label="No AI insights available" />
          )}

          <Link to="/ai-assistant" className="flex items-center justify-center gap-1.5 rounded-lg border bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50">
            <Sparkles size={13} className="text-violet-500" /> Open AI Assistant
          </Link>
        </div>
      )}
    </WidgetCard>
  )
}

function AssignedToMeWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'assigned-to-me'],
    queryFn: () => fetch('/api/dashboard/assigned-to-me', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
  })
  const items = data?.data || {}
  const allItems = [
    ...(items.leads || []).map((i: any) => ({ ...i, _module: 'leads', _icon: UserPlus, _color: 'text-violet-600 dark:text-violet-400', _label: 'Lead' })),
    ...(items.opportunities || []).map((i: any) => ({ ...i, _module: 'potentials', _icon: TrendingUp, _color: 'text-amber-600 dark:text-amber-400', _label: 'Opportunity' })),
    ...(items.tickets || []).map((i: any) => ({ ...i, _module: 'tickets', _icon: LifeBuoy, _color: 'text-rose-600 dark:text-rose-400', _label: 'Ticket' })),
    ...(items.tasks || []).map((i: any) => ({ ...i, _module: 'activities', _icon: CheckCircle2, _color: 'text-blue-600 dark:text-blue-400', _label: 'Task' })),
    ...(items.projects || []).map((i: any) => ({ ...i, _module: 'projects', _icon: FolderOpen, _color: 'text-sky-600 dark:text-sky-400', _label: 'Project' })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return (
    <WidgetCard title="Assigned to me" icon={UserCheck} tint="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
      {isLoading ? (
        <WidgetEmpty label="Loading..." />
      ) : allItems.length === 0 ? (
        <div className="p-6 text-center">
          <UserCheck size={24} className="mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">No records assigned to you</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
          {allItems.slice(0, 10).map((item: any) => {
            const Icon = item._icon
            return (
              <Link
                key={`${item._module}-${item.id}`}
                to={item.link || `/${item._module}/${item.id}`}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50"
              >
                <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted/50', item._color)}>
                  <Icon size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {item._label}
                    {item.status && ` · ${item.status}`}
                    {item.stage && ` · ${item.stage}`}
                    {item.priority && ` · ${item.priority}`}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {item.amount ? fmtMoney(item.amount) : formatDateTime(item.updatedAt)}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </WidgetCard>
  )
}
