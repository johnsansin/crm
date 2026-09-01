'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { CheckCircle2, CreditCard, Users } from 'lucide-react'

const date = (value?: string) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : 'Not set'

export function SubscriptionSettings() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  useEffect(() => { api.getSubscription().then(setData).catch(e => setError(e.message)) }, [])
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
  if (!data) return <div className="rounded-xl border p-5 text-sm text-muted-foreground">Loading subscription…</div>
  const features = Array.isArray(data.plan?.features) ? data.plan.features : []
  return <div className="space-y-5">
    <div className="rounded-2xl border bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white shadow-lg"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-violet-200">Selected by your superadmin</p><h2 className="mt-2 text-3xl font-extrabold">{data.plan?.name || data.plan?.code}</h2><p className="mt-2 max-w-xl text-sm text-violet-100">{data.plan?.description || 'Your organisation subscription plan.'}</p></div><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{data.status}</span></div>{data.plan?.price != null && <p className="mt-5 text-xl font-bold">${Number(data.plan.price).toLocaleString()} <span className="text-sm font-normal text-violet-200">· {String(data.plan.billingCycle || '').toLowerCase()}</span></p>}</div>
    <div className="grid gap-4 sm:grid-cols-2"><Usage icon={Users} label="Users" used={data.usage.users} limit={data.userLimit}/><Usage icon={CreditCard} label="Contacts" used={data.usage.contacts} limit={data.contactLimit}/></div>
    <div className="grid gap-3 rounded-2xl border bg-card p-5 sm:grid-cols-2"><Info label="Trial ends" value={date(data.trialEndsAt)}/><Info label="Subscription ends" value={date(data.subscriptionEndsAt)}/></div>
    {features.length > 0 && <section className="rounded-2xl border bg-card p-5"><h3 className="font-bold">Included in your plan</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{features.map((feature: string) => <div key={feature} className="flex items-start gap-2 text-sm"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600"/>{feature}</div>)}</div></section>}
    <p className="text-xs text-muted-foreground">Subscription plans and assignments are managed by the platform superadmin. Contact support if your organisation needs a different plan.</p>
  </div>
}

function Usage({ icon: Icon, label, used, limit }: any) { const pct=Math.min(100,Math.round((used/Math.max(1,limit))*100)); return <div className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-semibold"><Icon size={16}/>{label}</span><span className="text-xs text-muted-foreground">{used.toLocaleString()} / {limit.toLocaleString()}</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${pct}%`}}/></div></div> }
function Info({label,value}:any){return <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>}
