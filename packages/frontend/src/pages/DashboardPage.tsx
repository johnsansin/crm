import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Users, UserPlus, TrendingUp, LifeBuoy, Package, CalendarDays, Filter, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOrgSettings, formatDateTime, weekDayNames } from '@/lib/org-format'

const statCards = [
  { module: 'accounts', label: 'Accounts', icon: Building2, tile: 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400' },
  { module: 'contacts', label: 'Contacts', icon: Users, tile: 'bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400' },
  { module: 'leads', label: 'Leads', icon: UserPlus, tile: 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400' },
  { module: 'potentials', label: 'Opportunities', icon: TrendingUp, tile: 'bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400' },
  { module: 'tickets', label: 'Tickets', icon: LifeBuoy, tile: 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400' },
  { module: 'products', label: 'Products', icon: Package, tile: 'bg-cyan-100 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400' },
]

const quickActions = [
  { to: '/leads/new', label: 'New Lead' },
  { to: '/potentials/new', label: 'New Opportunity' },
  { to: '/tickets/new', label: 'New Ticket' },
  { to: '/projects/new', label: 'New Project' },
]

export function DashboardPage() {
  const { user } = useAuthStore()
  useOrgSettings()
  const name = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'there'
  const today = `${weekDayNames('long')[new Date().getDay()]}, ${formatDateTime(new Date())}`

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-md">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-24 -bottom-14 h-32 w-32 rounded-full bg-white/10" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {name}</h1>
            <p className="text-white/80 mt-1 text-sm">{today}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map(a => (
              <Link key={a.to} to={a.to} className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur hover:bg-white/25 transition-colors">
                <PlusCircle size={13} /> {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => (
          <StatCard key={card.module} {...card} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-6 md:grid-cols-2 content-start">
          <OpenOpportunitiesWidget />
          <OpenTicketsWidget />
          <RecentWidget module="potentials" title="Recent Opportunities" primary="potentialName" secondary={['stage', 'amount']} icon={TrendingUp} gradient="bg-gradient-to-r from-blue-500 to-indigo-600" empty="No opportunities yet" />
          <RecentWidget module="tickets" title="Recent Tickets" primary="title" secondary={['status', 'priority']} icon={LifeBuoy} gradient="bg-gradient-to-r from-cyan-600 to-sky-600" empty="No tickets yet" />
        </div>
        <div className="space-y-6 content-start">
          <SalesFunnelWidget />
          <UpcomingActivitiesWidget />
        </div>
      </div>
    </div>
  )
}

function StatCard({ module, label, icon: Icon, tile }: { module: string; label: string; icon: React.ElementType; tile: string }) {
  const { data } = useQuery({
    queryKey: [module, 'count'],
    queryFn: () => api.list(module, { limit: '1' }),
  })

  return (
    <Link to={`/${module}`}>
      <Card className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-lg ${tile}`}>
              <Icon size={20} />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{label}</span>
          </div>
          <p className="text-2xl font-bold mt-3">{data?.pagination?.total ?? '-'}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

function WidgetCard({ title, icon: Icon, gradient, children }: { title: string; icon: React.ElementType; gradient: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className={`${gradient} px-4 py-2.5 flex items-center gap-2 text-white`}>
        <Icon size={15} />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
}

function WidgetRow({ to, primary, secondary }: { to: string; primary: string; secondary?: string }) {
  return (
    <Link to={to} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm border-b last:border-0 hover:bg-accent transition-colors">
      <span className="font-medium truncate">{primary}</span>
      {secondary ? <span className="text-xs text-muted-foreground shrink-0">{secondary}</span> : null}
    </Link>
  )
}

function WidgetEmpty({ label }: { label: string }) {
  return <p className="px-4 py-6 text-sm text-muted-foreground text-center">{label}</p>
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
    <WidgetCard title="My Open Opportunities" icon={TrendingUp} gradient="bg-gradient-to-r from-orange-500 to-amber-600">
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
    <WidgetCard title="My Open Tickets" icon={LifeBuoy} gradient="bg-gradient-to-r from-red-500 to-rose-600">
      {isLoading ? <WidgetEmpty label="Loading..." /> : items.length === 0 ? <WidgetEmpty label="No open tickets" /> : items.map((r: any) => (
        <WidgetRow key={r.id} to={`/tickets/${r.id}`} primary={r.title} secondary={[r.status, r.priority].filter(Boolean).join(' · ')} />
      ))}
    </WidgetCard>
  )
}

function RecentWidget({ module, title, primary, secondary, icon, gradient, empty }: { module: string; title: string; primary: string; secondary: string[]; icon: React.ElementType; gradient: string; empty: string }) {
  const { data, isLoading } = useQuery({
    queryKey: [module, 'recent'],
    queryFn: () => api.list(module, { limit: '5', sortBy: 'createdAt', sortOrder: 'desc' }),
  })
  const rows = data?.data || []

  return (
    <WidgetCard title={title} icon={icon} gradient={gradient}>
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

  return (
    <WidgetCard title="Sales Funnel" icon={Filter} gradient="bg-gradient-to-r from-emerald-500 to-teal-600">
      <div className="p-4 space-y-3">
        {isLoading ? <WidgetEmpty label="Loading..." /> : groups.length === 0 ? <WidgetEmpty label="No opportunities to show" /> : groups.map(g => (
          <div key={g.stage}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">{g.stage}</span>
              <span className="text-muted-foreground">{g.count} · {fmtMoney(g.amount)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${Math.round((g.count / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}

function UpcomingActivitiesWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['calendar', 'upcoming'],
    queryFn: () => api.getUpcomingActivities(5),
  })
  const items = data?.data || []

  const fmt = (v: any) => {
    if (!v) return ''
    return formatDateTime(v)
  }

  return (
    <WidgetCard title="Upcoming Activities" icon={CalendarDays} gradient="bg-gradient-to-r from-violet-500 to-purple-600">
      {isLoading ? <WidgetEmpty label="Loading..." /> : items.length === 0 ? <WidgetEmpty label="No upcoming activities" /> : items.map((r: any) => (
        <WidgetRow key={r.id} to="/calendar" primary={r.subject} secondary={fmt(r.dueAt || r.startAt)} />
      ))}
    </WidgetCard>
  )
}
