'use client'

import { useMemo, useState } from 'react'
import { Link, useLocation } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowRight, BarChart3, BookOpen, Bot, Boxes, CheckCircle2, CircleHelp, FileText,
  Headphones, KeyRound, LayoutDashboard, LifeBuoy, Mail, Megaphone,
  Search, Settings2, ShieldCheck, Sparkles, Users, Workflow, X,
} from 'lucide-react'

type Guide = {
  id: string
  title: string
  summary: string
  category: string
  icon: typeof BookOpen
  href: string
  steps: string[]
  keywords: string
}

const guides: Guide[] = [
  { id: 'start', title: 'Get started with BizForce', summary: 'Learn the workspace, navigation, global search, notifications and Quick Create.', category: 'Getting started', icon: Sparkles, href: '/dashboard', keywords: 'start onboarding menu search notifications create', steps: ['Use the application menu to move between Sales, Marketing, Support, Projects and Inventory.', 'Press Ctrl/⌘ + K to search records across modules.', 'Use New from a module to create a complete record.', 'Open your profile menu to replay the guided product tour.'] },
  { id: 'dashboard', title: 'Dashboards and widgets', summary: 'Arrange widgets and monitor sales and service KPIs.', category: 'Workspace', icon: LayoutDashboard, href: '/dashboard', keywords: 'dashboard widget chart kpi tab customize refresh', steps: ['Choose the dashboard that matches your work.', 'Select Customize to show, hide or reorder widgets.', 'Create team dashboards when separate views are useful.', 'Set the refresh interval and save your layout.'] },
  { id: 'contacts', title: 'Contacts and organizations', summary: 'Manage people, companies, lifecycle stages and connected records.', category: 'Sales', icon: Users, href: '/contacts', keywords: 'contacts accounts organization lifecycle rating owner', steps: ['Create the organization first when a contact represents a company.', 'Add contact details, status, rating, owner and consent information.', 'Use record tabs for activities, comments, documents and related records.', 'Use tags, saved views and filters to segment contacts.'] },
  { id: 'pipeline', title: 'Leads, opportunities and forecasting', summary: 'Qualify leads and manage pipeline stages and probability.', category: 'Sales', icon: BarChart3, href: '/leads', keywords: 'lead opportunity potential forecast pipeline convert probability', steps: ['Capture a lead manually, by import or through a webform.', 'Record source, status, score, owner and next follow-up.', 'Convert qualified demand into CRM records.', 'Review stage probability, ageing and forecast totals.'] },
  { id: 'campaigns', title: 'Campaigns and email marketing', summary: 'Build audiences, respect consent and measure campaign delivery.', category: 'Marketing', icon: Megaphone, href: '/email-campaigns', keywords: 'campaign email audience opt in template bounce open click', steps: ['Create an audience using contacts, leads, tags or filters.', 'Confirm email consent and suppression status.', 'Design the message, sender identity and schedule.', 'Review delivery, open, click and failure results.'] },
  { id: 'automation', title: 'Workflows and automation', summary: 'Automate updates, notifications, assignments and scheduled actions.', category: 'Administration', icon: Workflow, href: '/settings?section=automation', keywords: 'workflow automation trigger condition action logs test', steps: ['Choose the module and trigger.', 'Add conditions so only intended records qualify.', 'Configure updates, notifications or email actions.', 'Test, activate and review execution logs.'] },
  { id: 'webforms', title: 'Webforms and lead capture', summary: 'Publish secure forms that create and assign CRM records.', category: 'Marketing', icon: FileText, href: '/settings?section=automation', keywords: 'webform embed captcha round robin lead capture', steps: ['Select a primary module and visitor fields.', 'Configure CAPTCHA, assignment and return URL.', 'Copy the embed code into your website.', 'Submit a test and verify assignment.'] },
  { id: 'inventory', title: 'Quotes, orders, invoices and PDFs', summary: 'Move from products and pricing through fulfilment and payment.', category: 'Inventory', icon: Boxes, href: '/quotes', keywords: 'quote order invoice product service pdf payment', steps: ['Maintain products, services, vendors, prices, taxes and currencies.', 'Prepare a quotation with line items and terms.', 'Create sales and purchase documents as work progresses.', 'Preview, download or email the PDF.'] },
  { id: 'support', title: 'Cases and customer support', summary: 'Track requests, SLA progress, escalation and resolution.', category: 'Support', icon: Headphones, href: '/tickets', keywords: 'ticket case support sla escalation agent portal', steps: ['Create or receive a case and link the customer.', 'Set priority, status, category and owner.', 'Collaborate using comments, documents and history.', 'Resolve the case and retain its audit trail.'] },
  { id: 'layouts', title: 'Modules, layouts and fields', summary: 'Configure modules, custom fields, picklists and record layouts.', category: 'Administration', icon: Settings2, href: '/settings?section=picklists', keywords: 'module layout custom field picklist dependency', steps: ['Enable the modules your organization needs.', 'Create fields with the correct type and visibility.', 'Configure picklist values and dependencies.', 'Test changes with a standard user.'] },
  { id: 'security', title: 'Users, roles and data security', summary: 'Control access, visibility and administrative responsibility.', category: 'Administration', icon: ShieldCheck, href: '/settings?section=users', keywords: 'user role profile group sharing audit login security', steps: ['Create roles that reflect your organization.', 'Define permissions for modules and sensitive fields.', 'Use groups and sharing rules for team access.', 'Review login history and audit logs.'] },
  { id: 'email', title: 'Email and communication', summary: 'Configure mailboxes, templates and tracked conversations.', category: 'Communication', icon: Mail, href: '/mailboxes', keywords: 'mailbox email template sender smtp tracking', steps: ['Connect an approved sending mailbox.', 'Create templates and organization signatures.', 'Send from a record to keep conversations linked.', 'Monitor delivery errors and authentication.'] },
  { id: 'privacy', title: 'Privacy and safe data handling', summary: 'Use consent, access controls, audit logs and retention responsibly.', category: 'Security', icon: KeyRound, href: '/settings?section=audit', keywords: 'privacy consent gdpr audit retention security', steps: ['Collect only information needed for a business purpose.', 'Record consent and honor opt-outs.', 'Restrict sensitive fields and exports.', 'Use audit and recycle-bin tools to review changes.'] },
  { id: 'ai', title: 'AI assistant', summary: 'Ask for CRM summaries and insights while keeping decisions reviewable.', category: 'Productivity', icon: Bot, href: '/ai-assistant', keywords: 'ai assistant insight summary lead pipeline', steps: ['Ask a focused question about CRM information.', 'Review source records before acting.', 'Never enter passwords or payment credentials.', 'Treat suggestions as assistance, not automatic decisions.'] },
]

const quickLinks = [
  { label: 'Create a contact', href: '/contacts/new' },
  { label: 'Import records', href: '/contacts' },
  { label: 'Build a report', href: '/reports' },
  { label: 'Configure users', href: '/settings?section=users' },
]

export function HelpCenterPage() {
  const { pathname } = useLocation()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState<Guide | null>(null)
  const categories = ['All', ...Array.from(new Set(guides.map(guide => guide.category)))]
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return guides.filter(guide => (category === 'All' || guide.category === category) && (!needle || `${guide.title} ${guide.summary} ${guide.keywords} ${guide.steps.join(' ')}`.toLowerCase().includes(needle)))
  }, [query, category])

  return <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8">
    <section className="overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700 text-white shadow-lg">
      <div className="grid gap-6 px-4 py-8 sm:px-7 sm:py-10 md:grid-cols-[minmax(0,1fr)_auto] lg:px-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-violet-100"><LifeBuoy size={15}/>BizForce Help Center</div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">What would you like to accomplish?</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">Search practical guidance for daily work, configuration, security and administration.</p>
          <div className="relative mt-5 max-w-2xl"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search contacts, workflows, permissions, invoices…" className="h-12 border-white/30 bg-white pl-11 text-slate-900 shadow-lg placeholder:text-slate-400" autoFocus/></div>
        </div>
        <div className="hidden self-center rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur md:block">
          <CircleHelp className="mx-auto h-10 w-10 text-violet-100" />
          <p className="mt-2 max-w-48 truncate text-center text-xs font-semibold">Current page: {pathname}</p>
        </div>
      </div>
    </section>

    <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Help categories">{categories.map(item => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${category === item ? 'border-violet-600 bg-violet-600 text-white' : 'bg-card text-muted-foreground hover:border-violet-400 hover:text-violet-700'}`}>{item}</button>)}</div>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="min-w-0"><div className="mb-3"><h2 className="text-lg font-bold">Guides</h2><p className="text-xs text-muted-foreground">{results.length} result{results.length === 1 ? '' : 's'}</p></div>
        {results.length ? <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{results.map(guide => { const Icon = guide.icon; return <button key={guide.id} onClick={() => setSelected(guide)} className="group min-w-0 rounded-xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-md"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950"><Icon size={19}/></span><div className="min-w-0"><span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">{guide.category}</span><h3 className="mt-0.5 font-bold group-hover:text-violet-700">{guide.title}</h3></div></div><p className="mt-3 text-sm leading-5 text-muted-foreground">{guide.summary}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-violet-700">Read guide <ArrowRight size={13}/></span></button>})}</div> : <div className="rounded-xl border border-dashed bg-card py-14 text-center"><Search className="mx-auto text-muted-foreground"/><h3 className="mt-3 font-bold">No guides found</h3><p className="mt-1 text-sm text-muted-foreground">Try another phrase or category.</p></div>}
      </section>
      <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start"><div className="rounded-xl border bg-card p-4 shadow-sm"><h2 className="font-bold">Quick actions</h2><div className="mt-3 divide-y">{quickLinks.map(item => <Link key={item.href + item.label} to={item.href} className="flex items-center justify-between py-2.5 text-sm font-medium hover:text-violet-700">{item.label}<ArrowRight size={14}/></Link>)}</div></div><div className="rounded-xl border border-violet-500/20 bg-violet-50 p-4 dark:bg-violet-950/40"><Headphones className="text-violet-700"/><h2 className="mt-3 font-bold">Still need help?</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">Use support chat and include the page, record and expected result. Never include a password.</p><Button className="mt-4 w-full bg-violet-700 hover:bg-violet-800" onClick={() => window.dispatchEvent(new CustomEvent('open-support-chat'))}>Open support chat</Button></div><div className="rounded-xl border bg-card p-4"><div className="flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-600"/><h2 className="font-bold">Keyboard shortcuts</h2></div><p className="mt-3 text-sm text-muted-foreground"><kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">Ctrl K</kbd> Global search</p></div></aside>
    </div>

    {selected && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="help-guide-title" onMouseDown={event => { if (event.currentTarget === event.target) setSelected(null) }}><div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border bg-card shadow-2xl sm:max-w-2xl sm:rounded-2xl"><div className="relative bg-gradient-to-r from-violet-700 to-indigo-700 p-5 pr-14 text-white"><button onClick={() => setSelected(null)} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20" aria-label="Close"><X size={16}/></button><span className="text-[10px] font-bold uppercase tracking-widest text-violet-100">{selected.category}</span><h2 id="help-guide-title" className="mt-1 text-xl font-bold">{selected.title}</h2><p className="mt-1 text-sm text-violet-100">{selected.summary}</p></div><div className="p-4 sm:p-5"><ol className="space-y-4">{selected.steps.map((step, index) => <li key={step} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-300">{index + 1}</span><p className="pt-1 text-sm leading-6">{step}</p></li>)}</ol><div className="mt-6 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => setSelected(null)}>Close</Button><Button asChild className="bg-violet-700 hover:bg-violet-800"><Link to={selected.href}>Open this area <ArrowRight className="ml-1" size={14}/></Link></Button></div></div></div></div>}
  </div>
}
