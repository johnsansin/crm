import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Users, UserPlus, TrendingUp, LifeBuoy, Package, CalendarDays } from 'lucide-react'

const statCards = [
  { module: 'accounts', label: 'Accounts', icon: Building2, color: 'text-blue-600' },
  { module: 'contacts', label: 'Contacts', icon: Users, color: 'text-green-600' },
  { module: 'leads', label: 'Leads', icon: UserPlus, color: 'text-purple-600' },
  { module: 'potentials', label: 'Opportunities', icon: TrendingUp, color: 'text-orange-600' },
  { module: 'tickets', label: 'Tickets', icon: LifeBuoy, color: 'text-red-600' },
  { module: 'products', label: 'Products', icon: Package, color: 'text-cyan-600' },
]

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to BizForce CRM</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => (
          <StatCard key={card.module} {...card} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <OpenOpportunitiesWidget />
        <OpenTicketsWidget />
        <RecentWidget module="potentials" title="Recent Opportunities" primary="potentialName" secondary={['stage', 'amount']} icon={TrendingUp} gradient="bg-gradient-to-r from-blue-500 to-indigo-600" empty="No opportunities yet" />
        <RecentWidget module="tickets" title="Recent Tickets" primary="title" secondary={['status', 'priority']} icon={LifeBuoy} gradient="bg-gradient-to-r from-cyan-600 to-sky-600" empty="No tickets yet" />
        <UpcomingActivitiesWidget />
      </div>
    </div>
  )
}

function StatCard({ module, label, icon: Icon, color }: { module: string; label: string; icon: React.ElementType; color: string }) {
  const { data } = useQuery({
    queryKey: [module, 'count'],
    queryFn: () => api.list(module, { limit: '1' }),
  })

  return (
    <Link to={`/${module}`}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-background ${color}`}>
            <Icon size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold">{data?.pagination?.total ?? '-'}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
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

function UpcomingActivitiesWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['calendar', 'upcoming'],
    queryFn: () => api.getUpcomingActivities(5),
  })
  const items = data?.data || []

  const fmt = (v: any) => {
    if (!v) return ''
    return new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  return (
    <WidgetCard title="Upcoming Activities" icon={CalendarDays} gradient="bg-gradient-to-r from-violet-500 to-purple-600">
      {isLoading ? <WidgetEmpty label="Loading..." /> : items.length === 0 ? <WidgetEmpty label="No upcoming activities" /> : items.map((r: any) => (
        <WidgetRow key={r.id} to="/calendar" primary={r.subject} secondary={fmt(r.dueAt || r.startAt)} />
      ))}
    </WidgetCard>
  )
}
