import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard', settings: 'Settings', profile: 'My Profile', reports: 'Reports', forecast: 'Forecasting',
  'email-campaigns': 'Email Campaigns', campaigns: 'Campaigns', leads: 'Leads', potentials: 'Opportunities',
  contacts: 'Contacts', accounts: 'Accounts', quotes: 'Quotations', salesorders: 'Sales Orders', invoices: 'Invoices',
  purchaseorders: 'Purchase Orders', tickets: 'Support Tickets', projects: 'Projects', calendar: 'Calendar',
  'ai-assistant': 'AI Assistant', new: 'New', edit: 'Edit', superadmin: 'Superadmin', organizations: 'Organizations', users: 'Users',
}

function label(segment: string) {
  if (LABELS[segment]) return LABELS[segment]
  if (/^[0-9a-f-]{16,}$/i.test(segment)) return 'Record details'
  return segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function AppBreadcrumbs() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  if (!parts.length) return null
  const homeHref = pathname === '/superadmin' || pathname.startsWith('/superadmin/') ? '/superadmin/organizations' : '/dashboard'
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex min-h-6 items-center gap-1 overflow-x-auto whitespace-nowrap text-xs text-muted-foreground">
      <Link to={homeHref} className="inline-flex items-center gap-1 hover:text-primary"><Home size={13} /> CRM</Link>
      {parts.map((part, index) => {
        const href = `/${parts.slice(0, index + 1).join('/')}`
        const current = index === parts.length - 1
        return <Fragment key={href}><ChevronRight size={12} className="shrink-0 opacity-50" />{current
          ? <span className="rounded-md bg-primary/10 px-2 py-1 font-semibold text-primary" aria-current="page">{label(part)}</span>
          : <Link to={href} className="hover:text-primary">{label(part)}</Link>}</Fragment>
      })}
    </nav>
  )
}

export function CrmFlowGuide() {
  const steps = [
    { name: 'Campaigns', href: '/campaigns', paths: ['/campaigns', '/email-campaigns'] },
    { name: 'Leads', href: '/leads', paths: ['/leads'] },
    { name: 'Opportunities', href: '/potentials', paths: ['/potentials', '/forecast'] },
    { name: 'Accounts & Contacts', href: '/accounts', paths: ['/accounts', '/contacts'] },
    { name: 'Quotes', href: '/quotes', paths: ['/quotes'] },
    { name: 'Sales Orders', href: '/salesorders', paths: ['/salesorders'] },
    { name: 'Invoices', href: '/invoices', paths: ['/invoices', '/recurringinvoices', '/receipts'] },
    { name: 'Support & Retention', href: '/tickets', paths: ['/tickets', '/escalationhistory', '/servicecontracts'] },
  ]
  const { pathname } = useLocation()
  if (!steps.some(step => step.paths.some(path => pathname === path || pathname.startsWith(`${path}/`)))) return null
  return (
    <div className="mb-4 hidden xl:flex items-center rounded-xl border border-border/70 bg-card/80 px-3 py-2 shadow-sm overflow-x-auto" aria-label="CRM workflow">
      <span className="mr-3 shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CRM flow</span>
      {steps.map((step, index) => <Fragment key={step.href}>
        {index > 0 && <ChevronRight size={12} className="mx-1 shrink-0 text-muted-foreground/50" />}
        <Link to={step.href} className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${step.paths.some(path => pathname === path || pathname.startsWith(`${path}/`)) ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{step.name}</Link>
      </Fragment>)}
    </div>
  )
}
