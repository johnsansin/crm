'use client'

import { useNavigate } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import { SiteLayout } from '@/components/SiteLayout'
import {
  ArrowRight, BarChart3, BellRing, Building2, Calendar, CheckCircle, FileText,
  Globe, Headphones, LayoutDashboard, Mail, MessageSquare, Package, Phone,
  Settings, Shield, Sparkles, TrendingUp, Users, Workflow, Zap
} from 'lucide-react'

const featureGroups = [
  {
    icon: TrendingUp,
    title: 'Sales',
    description: 'Run a complete sales process — from first lead to signed deal — with pipelines, quotes, and forecasting.',
    features: ['Leads', 'Opportunities', 'Quotes', 'Sales Orders', 'Price Books', 'Stage Probabilities', 'Quantity Discounts', 'Competitors'],
  },
  {
    icon: Package,
    title: 'Products & Inventory',
    description: 'Manage your catalog, track stock, and close orders from a single screen with full inventory visibility.',
    features: ['Products', 'Services', 'Point of Sale', 'Vendors', 'Assets'],
  },
  {
    icon: Mail,
    title: 'Marketing',
    description: 'Build email campaigns, track engagement, and automate your outreach with real-time analytics.',
    features: ['Campaigns', 'Email Templates', 'SMS Notifier', 'Mailboxes', 'RSS Feeds'],
  },
  {
    icon: FileText,
    title: 'Finance & Invoicing',
    description: 'Create professional invoices, accept payments, and automate billing with recurring revenue tools.',
    features: ['Accounts', 'Invoices', 'Receipts', 'Payments', 'Recurring Invoices', 'Currencies', 'Tax Info'],
  },
  {
    icon: Building2,
    title: 'Purchasing',
    description: 'Streamline procurement with purchase orders, vendor management, and payment tracking.',
    features: ['Purchase Orders', 'Vendors', 'Payments', 'Receipts'],
  },
  {
    icon: Headphones,
    title: 'Support',
    description: 'Deliver exceptional customer service with ticketing, escalation workflows, and a built-in help center.',
    features: ['Tickets', 'Ticket Comments', 'Escalation History', 'FAQ'],
  },
  {
    icon: Users,
    title: 'Team & Collaboration',
    description: 'Keep your team aligned with shared projects, roles, permissions, and real-time collaboration.',
    features: ['Projects', 'Project Tasks', 'Project Milestones', 'Project Resources', 'Roles', 'User Groups', 'Role Permissions'],
  },
  {
    icon: Calendar,
    title: 'Calendar & Communication',
    description: 'Schedule meetings, log calls, and capture every customer interaction in one timeline.',
    features: ['Calendar', 'Phone Calls', 'Emails', 'Documents', 'Time Entries'],
  },
  {
    icon: Workflow,
    title: 'Automation',
    description: 'Eliminate repetitive work with workflow rules, triggers, and actions that run your processes on autopilot.',
    features: ['Workflow Automation', 'Email Triggers', 'Webhooks', 'Custom Alerts', 'Scheduled Tasks'],
  },
  {
    icon: BarChart3,
    title: 'Reporting & Analytics',
    description: 'Understand your business with real-time reports, custom dashboards, and revenue forecasting.',
    features: ['Reports', 'Dashboards', 'Revenue Forecasting', 'Sales Analytics', 'Customer Insights'],
  },
]

const highlights = [
  { icon: Sparkles, title: 'AI Assistant', description: 'Draft emails, summarize records, and get smart suggestions powered by AI — right where you work.' },
  { icon: LayoutDashboard, title: 'Custom Dashboards', description: 'Build drag-and-drop dashboards with the KPIs that matter most to your team.' },
  { icon: Zap, title: 'Workflow Automation', description: 'Set triggers and actions to route leads, assign tasks, and update records automatically.' },
  { icon: Globe, title: 'Multi-Organization', description: 'Manage subsidiaries and business units from one platform with isolated data and role-based access.' },
  { icon: BellRing, title: 'Real-Time Notifications', description: 'Stay on top of every deal, ticket, and update with instant alerts across channels.' },
  { icon: Shield, title: 'Enterprise-Grade Security', description: 'Role-based permissions, audit logs, and granular access control keep your data safe.' },
]

export function FeaturesPage() {
  const navigate = useNavigate()

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-sky-300/50 to-blue-400/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tl from-indigo-400/40 to-violet-300/40 blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/10 backdrop-blur text-sm text-slate-600 dark:text-slate-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            24+ modules · 120+ data models · AI-powered
          </div>
          <h1 className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-slate-900 dark:text-white">
            Everything your business needs to{' '}
            <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 dark:from-sky-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              sell, support & grow
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            BizForce CRM brings sales, marketing, support, operations, and finance together in one platform. No juggling separate subscriptions, no manual data entry.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="relative h-13 overflow-hidden rounded-xl text-white text-base font-semibold px-8 border-none bg-gradient-to-b from-sky-500 via-blue-600 to-blue-700 hover:from-sky-400 hover:via-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/40 transition-all"
              onClick={() => navigate('/signup')}
            >
              <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-lg pointer-events-none" />
              <span className="relative inline-flex items-center"><Sparkles size={18} className="mr-2" />Start Free Trial</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 px-8 text-base rounded-xl border-white/70 dark:border-white/15 bg-white/70 dark:bg-white/10 backdrop-blur text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/20"
              onClick={() => navigate('/pricing')}
            >
              View Pricing
            </Button>
          </div>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { value: '24+', label: 'CRM modules' },
              { value: '120+', label: 'Data models' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '25+', label: 'Integrations' },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border border-white/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur px-4 py-5 shadow-sm">
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 sm:py-20 bg-white/40 dark:bg-white/5 backdrop-blur border-y border-slate-200/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Why teams choose BizForce</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Powerful capabilities that go beyond traditional CRM.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map(item => (
              <div key={item.title} className="group relative p-6 rounded-2xl border border-white/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-sky-200/40 dark:shadow-indigo-950/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="relative w-10 h-10 overflow-hidden rounded-lg bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
                  <item.icon size={20} className="relative text-white" />
                </div>
                <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module Groups */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">24+ modules, one platform</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Every module works together, sharing data in real time. Configure the ones you need, scale as you grow.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {featureGroups.map(group => (
              <div key={group.title} className="group rounded-2xl border border-white/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 shadow-lg shadow-sky-200/30 dark:shadow-indigo-950/30 hover:shadow-xl hover:border-sky-300 dark:hover:border-sky-600/50 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-11 h-11 overflow-hidden rounded-lg bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
                    <group.icon size={22} className="relative text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{group.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-xs">{group.features.join(' · ')}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{group.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-16 sm:py-20 bg-white/40 dark:bg-white/5 backdrop-blur border-y border-slate-200/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Deep capabilities in every module</h2>
              <ul className="mt-8 space-y-4">
                {[
                  'Full CRUD on 120+ data models with advanced filters and saved views',
                  'Custom fields, layouts, and module configuration to match your process',
                  'Role-based permissions and granular access control for every team',
                  'Audit trails, activity logs, and real-time notificationalerting',
                  'Import, export, and clean data migration from any existing system',
                  'RESTful API and webhooks for custom integrations on Enterprise',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                    <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="rounded-2xl bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 p-8 border border-slate-200/60 dark:border-white/10 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: LayoutDashboard, label: 'Dashboard', color: 'from-sky-500 to-blue-600' },
                    { icon: TrendingUp, label: 'Sales Pipeline', color: 'from-blue-500 to-indigo-600' },
                    { icon: Headphones, label: 'Support Tickets', color: 'from-indigo-500 to-violet-600' },
                    { icon: MessageSquare, label: 'Live Chat', color: 'from-violet-500 to-purple-600' },
                    { icon: Phone, label: 'SMS & Calls', color: 'from-purple-500 to-fuchsia-600' },
                    { icon: Globe, label: 'AI Assistant', color: 'from-sky-500 to-cyan-600' },
                    { icon: Zap, label: 'Automation', color: 'from-amber-500 to-orange-600' },
                    { icon: Settings, label: 'Configuration', color: 'from-slate-500 to-slate-700' },
                  ].map(item => (
                    <div key={item.label} className="p-4 rounded-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 backdrop-blur hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-3`}>
                        <item.icon size={18} className="text-white" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-700 dark:from-sky-500 dark:via-blue-600 dark:to-indigo-600 p-10 sm:p-16 shadow-2xl shadow-blue-600/30 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <h2 className="relative text-3xl sm:text-4xl font-bold text-white tracking-tight">Ready to see BizForce in action?</h2>
            <p className="relative mt-4 text-lg text-sky-100 max-w-xl mx-auto">
              Start free for up to 3 users and 2,000 contacts. 14-day trial on paid plans — no credit card required.
            </p>
            <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="h-13 px-8 text-base rounded-xl bg-white text-blue-700 font-semibold hover:bg-sky-50 shadow-lg hover:shadow-xl transition-all border-none"
                onClick={() => navigate('/signup')}
              >
                Get Started Free <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-13 px-8 text-base rounded-xl border-white/40 bg-white/10 text-white font-semibold backdrop-blur hover:bg-white/20 transition-all"
                onClick={() => navigate('/contact')}
              >
                Talk to Sales
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}