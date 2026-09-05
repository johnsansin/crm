'use client'

import { useState } from 'react'
import { Search, Mail, Calendar, MessageSquare, CreditCard, Phone, Globe, Cloud, Boxes, Plug, ArrowRight } from 'lucide-react'
import { useNavigate } from '@/lib/navigation'
import { SiteLayout } from '@/components/SiteLayout'
import { cn } from '@/lib/utils'

interface Integration {
  name: string
  category: string
  desc: string
  icon: any
  type: 'built-in' | 'connect'
}

const INTEGRATIONS: Integration[] = [
  { name: 'Gmail', category: 'Email', desc: 'Send and log emails, track conversations in your contact records.', icon: Mail, type: 'connect' },
  { name: 'Outlook', category: 'Email', desc: 'Sync your Microsoft inbox for logged communications.', icon: Mail, type: 'connect' },
  { name: 'Google Calendar', category: 'Calendar', desc: 'Two-way calendar sync for meetings and follow-ups.', icon: Calendar, type: 'connect' },
  { name: 'Google Workspace / Cloud Identity SSO', category: 'Security', desc: 'Sign in with your Google company account.', icon: Cloud, type: 'connect' },
  { name: 'Slack', category: 'Collaboration', desc: 'Post CRM updates and sales events to your channels.', icon: MessageSquare, type: 'connect' },
  { name: 'Zapier', category: 'Automation', desc: 'Connect BizForce to 5,000+ apps with no-code zaps.', icon: ZapApp, type: 'connect' },
  { name: 'Stripe', category: 'Payments', desc: 'Track payments and link revenue to your deals.', icon: CreditCard, type: 'connect' },
  { name: 'PayPal', category: 'Payments', desc: 'Record receipts and payment status against invoices.', icon: CreditCard, type: 'connect' },
  { name: 'Twilio', category: 'Voice & SMS', desc: 'Make calls and send SMS campaigns.', icon: Phone, type: 'connect' },
  { name: 'Mailchimp', category: 'Marketing', desc: 'Sync audiences and campaigns from your CRM.', icon: Boxes, type: 'connect' },
  { name: 'WordPress', category: 'Web', desc: 'Add lead-capture forms to your WordPress site.', icon: Globe, type: 'connect' },
  { name: 'REST API', category: 'Developer', desc: 'Full programmatic access to your data and modules.', icon: Plug, type: 'built-in' },
  { name: 'Webhooks', category: 'Developer', desc: 'Send real-time events to your own applications.', icon: ZapApp, type: 'built-in' },
  { name: 'Customer Portal', category: 'Built-in', desc: 'Self-service client portal with login and status tracking.', icon: Boxes, type: 'built-in' },
  { name: 'PBX / Phone', category: 'Voice', desc: 'Software phone with call logging and callbacks.', icon: Phone, type: 'built-in' },
  { name: 'Webforms', category: 'Web', desc: 'Embed lead-capture forms on any website.', icon: Globe, type: 'built-in' },
  { name: 'AI Assistant & Lead Agent', category: 'AI', desc: 'Built-in AI scoring, drafting, and decision agent.', icon: ZapApp, type: 'built-in' },
]

function ZapApp({ size }: { size?: number }) {
  return (
    <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  )
}

const CATEGORIES = ['All', ...Array.from(new Set(INTEGRATIONS.map(i => i.category)))]

export function IntegrationsPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('All')

  const filtered = INTEGRATIONS.filter(i =>
    (active === 'All' || i.category === active) &&
    (!query || i.name.toLowerCase().includes(query.toLowerCase()) || i.desc.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <SiteLayout>
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-sky-300/50 to-blue-400/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tl from-indigo-400/40 to-violet-300/40 blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/10 backdrop-blur text-sm text-slate-600 dark:text-slate-300 shadow-sm mb-6">
              <Plug size={14} className="text-blue-500" />
              Integrations
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
              Connect BizForce with{' '}
              <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 dark:from-sky-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                the tools you use
              </span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
              Native capabilities and integrations for email, calendars, payments, voice, and web — plus a full REST API and webhooks.
            </p>
            <div className="relative max-w-xl mx-auto mt-8">
              <div className="absolute inset-y-0 left-4 flex items-center text-slate-400"><Search size={18} /></div>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search integrations..."
                className="w-full h-13 pl-12 pr-4 rounded-xl border border-white/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-sky-200/40 dark:shadow-indigo-950/40 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                    active === cat
                      ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                      : 'border border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/20 hover:shadow-md')}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24 sm:pb-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 bg-white/40 dark:bg-white/5 backdrop-blur">
              <Plug size={40} className="mx-auto text-slate-400 mb-3" />
              <p className="text-lg font-medium text-slate-700 dark:text-slate-200">No integrations found</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(i => {
                const Icon = i.icon
                return (
                  <div key={i.name} className="group relative overflow-hidden rounded-2xl border border-white/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-sky-300 dark:hover:border-sky-700">
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-sky-500/10 to-indigo-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">{Icon ? <Icon size={20} /> : <Plug size={20} />}</span>
                        <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide',
                          i.type === 'built-in' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300')}>
                          {i.type === 'built-in' ? 'Built-in' : 'Connect'}
                        </span>
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">{i.name}</h3>
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{i.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-14 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-8 sm:p-10 text-center overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Need a specific integration?</h2>
              <p className="mt-3 text-blue-100 max-w-xl mx-auto">Our REST API and webhooks let you build or connect virtually anything. Reach out and we'll help you get set up.</p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => navigate('/contact')} className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-lg hover:bg-blue-50 transition-colors cursor-pointer">
                  Contact us <ArrowRight size={16} />
                </button>
                <button onClick={() => navigate('/pricing')} className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer">
                  View pricing
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
