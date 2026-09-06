'use client'

import { formatDate, formatDateTime } from '@/lib/org-format'

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Lock, User, Mail, Phone, Building2, FileText, Ticket, Loader2, LogOut, Plus, Send, Eye,
  ArrowLeft, Download, CreditCard, CheckCircle2, MessageSquare, ShieldCheck,
} from 'lucide-react'

const PORTAL_API = '/api/portal'

const fmtMoney = (n: any) => `$${Number(n || 0).toFixed(2)}`

function statusTone(status?: string | null): string {
  const s = (status || '').toLowerCase()
  if (/paid|resolved|closed|completed|approved|delivered/.test(s)) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
  if (/overdue|urgent|cancelled|failed|declined|refunded|void/.test(s)) return 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
  if (/in progress|waiting|pending|awaiting|partial/.test(s)) return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
  if (/draft|open|new|active/.test(s)) return 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400'
  return 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400'
}

function priorityText(priority?: string | null): string {
  const s = (priority || '').toLowerCase()
  if (s === 'urgent') return 'text-rose-600 dark:text-rose-400'
  if (s === 'high') return 'text-amber-600 dark:text-amber-400'
  if (s === 'low') return 'text-slate-500 dark:text-slate-400'
  return 'text-sky-600 dark:text-sky-400'
}

function Chip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${className}`}>
      {children}
    </span>
  )
}

function Avatar({ name, className = '' }: { name: string; className?: string }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'
  return (
    <div className={`flex items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold ${className}`}>
      {initial}
    </div>
  )
}

interface PortalUser {
  id: string
  name: string
  email: string
  company?: string
}

export function PortalPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => typeof window === 'undefined' ? null : localStorage.getItem('portal_token'))
  const [portalUser, setPortalUser] = useState<PortalUser | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [activeTab, setActiveTab] = useState('tickets')
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketForm, setTicketForm] = useState({ title: '', description: '', priority: 'Normal', category: '' })
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', company: '' })

  const portalHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {}

  const loginMutation = useMutation({
    mutationFn: async () => {
      setLoggingIn(true)
      const res = await fetch(`${PORTAL_API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Login failed') }
      return res.json()
    },
    onSettled: () => setLoggingIn(false),
    onSuccess: (data) => {
      localStorage.setItem('portal_token', data.data.token)
      setToken(data.data.token)
      setPortalUser(data.data.user)
      setProfileForm({ name: data.data.user.name, phone: '', company: data.data.user.company || '' })
      addToast({ title: 'Welcome to your portal', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Login failed', description: e.message, variant: 'destructive' }),
  })

  useEffect(() => {
    if (token && !portalUser) {
      fetch(`${PORTAL_API}/profile`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => { setPortalUser(d.data); setProfileForm({ name: d.data.name, phone: d.data.phone || '', company: d.data.company || '' }) })
        .catch(() => { localStorage.removeItem('portal_token'); setToken(null) })
    }
  }, [token])

  const logout = () => {
    localStorage.removeItem('portal_token')
    setToken(null)
    setPortalUser(null)
  }

  const { data: ticketsData } = useQuery({
    queryKey: ['portal-tickets'],
    queryFn: () => fetch(`${PORTAL_API}/tickets`, { headers: portalHeaders }).then(r => r.json()),
    enabled: !!token,
  })

  const { data: invoicesData } = useQuery({
    queryKey: ['portal-invoices'],
    queryFn: () => fetch(`${PORTAL_API}/invoices`, { headers: portalHeaders }).then(r => r.json()),
    enabled: !!token,
  })

  const { data: documentsData } = useQuery({
    queryKey: ['portal-documents'],
    queryFn: () => fetch(`${PORTAL_API}/documents`, { headers: portalHeaders }).then(r => r.json()),
    enabled: !!token,
  })

  const { data: ticketDetail } = useQuery({
    queryKey: ['portal-ticket', selectedTicketId],
    queryFn: () => fetch(`${PORTAL_API}/tickets/${selectedTicketId}`, { headers: portalHeaders }).then(r => r.json()),
    enabled: !!selectedTicketId,
  })

  const { data: invoiceDetail } = useQuery({
    queryKey: ['portal-invoice', selectedInvoiceId],
    queryFn: () => fetch(`${PORTAL_API}/invoices/${selectedInvoiceId}`, { headers: portalHeaders }).then(r => r.json()),
    enabled: !!selectedInvoiceId,
  })

  const createTicketMutation = useMutation({
    mutationFn: (data: any) => fetch(`${PORTAL_API}/tickets`, { method: 'POST', headers: portalHeaders, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['portal-tickets'] }); setShowTicketForm(false); setTicketForm({ title: '', description: '', priority: 'Normal', category: '' }); addToast({ title: 'Ticket created', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const addCommentMutation = useMutation({
    mutationFn: (comment: string) => fetch(`${PORTAL_API}/tickets/${selectedTicketId}/comments`, { method: 'POST', headers: portalHeaders, body: JSON.stringify({ comment }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['portal-ticket', selectedTicketId] }); setCommentText(''); addToast({ title: 'Comment added', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => fetch(`${PORTAL_API}/profile`, { method: 'PUT', headers: portalHeaders, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { addToast({ title: 'Profile updated', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  if (!token) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-800 via-blue-700 to-indigo-900 flex">
        <div className="absolute -top-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-sky-400/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[34rem] h-[34rem] rounded-full bg-indigo-400/30 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="hidden lg:flex flex-col justify-between p-14 w-[46%] relative text-white">
          <div className="flex items-center gap-3">
            <img src="/bizforce-mark.svg" alt="BizForce" className="h-10 w-10 rounded-xl shadow-lg" />
            <div>
              <p className="text-xl font-bold leading-tight">BizForce</p>
              <p className="text-sm text-blue-100/80">Customer Portal</p>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs text-blue-50">
              <ShieldCheck size={13} /> Secure member area
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-tight">
              Everything about your account, in one place.
            </h1>
            <p className="mt-4 text-blue-100/90 max-w-md">
              Follow your support requests, review your invoices and access shared documents — from anywhere.
            </p>
            <div className="mt-8 space-y-3">
              {[
                { icon: MessageSquare, title: 'Support tickets', desc: 'Raise requests and track their status in real time.' },
                { icon: CreditCard, title: 'Invoices', desc: 'View what is billed and the details of every line item.' },
                { icon: FileText, title: 'Documents', desc: 'Download files your organization shares with you.' },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="mt-0.5 w-9 h-9 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
                    <f.icon size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="text-xs text-blue-100/70">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-blue-100/60">© {new Date().getFullYear()} BizForce CRM · Powered by BizForce</p>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 relative">
          <div className="w-full max-w-md rounded-2xl bg-white/95 dark:bg-slate-900/90 backdrop-blur shadow-2xl border border-white/40 dark:border-white/10 p-8">
            <div className="text-center">
              <img src="/bizforce-mark.svg" alt="BizForce" className="mx-auto h-12 w-12 rounded-xl shadow-md" />
              <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Customer Portal</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in with the email and access code your organization issued to you.</p>
            </div>

            <form onSubmit={e => { e.preventDefault(); loginMutation.mutate() }} className="mt-7 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <div className="relative mt-1">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="pl-9 h-11" required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Access code</label>
                <div className="relative mt-1">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-9 h-11" required />
                </div>
              </div>
              <Button type="submit" disabled={loggingIn} className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700">
                {loggingIn ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Lock size={15} className="mr-2" />}
                {loggingIn ? 'Signing in…' : 'Sign in to portal'}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
              Do not have an access code? Contact your organization&apos;s administrator.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const tickets = ticketsData?.data || []
  const invoices = invoicesData?.data || []
  const documents = documentsData?.data || []
  const ticket = ticketDetail?.data
  const invoice = invoiceDetail?.data

  const firstName = (portalUser?.name || 'there').trim().split(' ')[0]
  const openTickets = tickets.filter((t: any) => !/closed|resolved|cancelled/i.test(t.status || '')).length
  const totalInvoiced = invoices.reduce((s: number, i: any) => s + Number(i.grandTotal || 0), 0)

  const stats = [
    { icon: Ticket, label: 'Open tickets', value: String(openTickets) },
    { icon: CreditCard, label: 'Invoices', value: String(invoices.length) },
    { icon: FileText, label: 'Documents', value: String(documents.length) },
    { icon: CheckCircle2, label: 'Total billed', value: fmtMoney(totalInvoiced) },
  ]

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <header className="sticky top-0 z-20 bg-white/85 dark:bg-slate-900/85 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/bizforce-mark.svg" alt="BizForce" className="h-8 w-8 rounded-lg shadow-sm" />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">Customer Portal</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{portalUser?.email || ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              <Avatar name={portalUser?.name || '?'} className="h-7 w-7 text-xs" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{portalUser?.name || ''}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut size={14} className="mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-sky-300/20 blur-2xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl font-bold">Welcome back, {firstName}</h2>
            <p className="mt-1 text-sm text-blue-100">Here is a quick snapshot of your organization account.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-3">
                  <div className="flex items-center gap-2 text-blue-100">
                    <s.icon size={14} />
                    <span className="text-[11px] uppercase tracking-wide">{s.label}</span>
                  </div>
                  <p className="mt-1.5 text-xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <TabsRoot value={activeTab} onValueChange={setActiveTab}>
            <div className="px-4 pt-4">
              <TabsList>
                <TabsTrigger value="tickets"><Ticket size={14} className="mr-1" /> My Requests</TabsTrigger>
                <TabsTrigger value="invoices"><CreditCard size={14} className="mr-1" /> Invoices</TabsTrigger>
                <TabsTrigger value="documents"><FileText size={14} className="mr-1" /> Documents</TabsTrigger>
                <TabsTrigger value="profile"><User size={14} className="mr-1" /> Profile</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="tickets" className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Requests</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Track or start a support request.</p>
                  </div>
                  <Button size="sm" className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700" onClick={() => setShowTicketForm(true)}>
                    <Plus size={14} className="mr-1" /> New Ticket
                  </Button>
                </div>

                {selectedTicketId && ticket ? (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Chip className={statusTone(ticket.status)}>{ticket.status || 'Open'}</Chip>
                            <Chip className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{ticket.priority || 'Normal'} priority</Chip>
                          </div>
                          <CardTitle className="text-base mt-2">{ticket.title}</CardTitle>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Opened {formatDate(ticket.createdAt)}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSelectedTicketId(null)}>
                          <ArrowLeft size={14} className="mr-1" /> Back
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {ticket.description && (
                        <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3">{ticket.description}</p>
                      )}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Conversation</h4>
                        {(ticket.ticketComments || []).length === 0 ? (
                          <p className="text-xs text-slate-400">No replies yet — our team will respond shortly.</p>
                        ) : (
                          <div className="space-y-2">
                            {(ticket.ticketComments || []).map((c: any) => (
                              <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-sm">
                                <p className="text-slate-700 dark:text-slate-300">{c.comment}</p>
                                <span className="text-[11px] text-slate-400">{formatDateTime(c.createdAt)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a reply…" className="h-10" />
                        <Button size="sm" onClick={() => addCommentMutation.mutate(commentText)} disabled={!commentText.trim() || addCommentMutation.isPending}>
                          {addCommentMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : tickets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Ticket size={20} className="text-slate-400" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">No requests yet</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">When you need help, create a ticket and we will get back to you.</p>
                    <Button size="sm" className="mt-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700" onClick={() => setShowTicketForm(true)}>
                      <Plus size={14} className="mr-1" /> Create your first ticket
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {tickets.map((t: any) => (
                      <button key={t.id} onClick={() => setSelectedTicketId(t.id)} className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Chip className={statusTone(t.status)}>{t.status || 'Open'}</Chip>
                          <span className={`text-[11px] font-medium ${priorityText(t.priority)}`}>{t.priority || 'Normal'}</span>
                          <span className="ml-auto text-[11px] text-slate-400">{formatDate(t.createdAt)}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{t.title}</p>
                        {t.description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{t.description}</p>}
                        <span className="mt-3 inline-flex items-center text-xs font-medium text-sky-600 dark:text-sky-400">
                          View details <Eye size={12} className="ml-1" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="invoices" className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invoices</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Your billing history and line-item details.</p>
                </div>

                {selectedInvoiceId && invoice ? (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Chip className={statusTone(invoice.invoiceStatus)}>{invoice.invoiceStatus || 'Open'}</Chip>
                          </div>
                          <CardTitle className="text-base mt-2">{invoice.subject}</CardTitle>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Issued {formatDate(invoice.createdAt)}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSelectedInvoiceId(null)}>
                          <ArrowLeft size={14} className="mr-1" /> Back
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {(invoice.lineItems || []).length > 0 && (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800/70 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                <th className="px-4 py-2.5 font-medium">Item</th>
                                <th className="px-4 py-2.5 font-medium text-right">Qty</th>
                                <th className="px-4 py-2.5 font-medium text-right">Price</th>
                                <th className="px-4 py-2.5 font-medium text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {invoice.lineItems.map((li: any) => (
                                <tr key={li.id}>
                                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{li.itemName}</td>
                                  <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-400">{li.qty}</td>
                                  <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-400">{fmtMoney(li.unitPrice)}</td>
                                  <td className="px-4 py-2.5 text-right font-medium text-slate-900 dark:text-white">{fmtMoney(li.lineTotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="flex justify-end px-4 py-3 bg-slate-50 dark:bg-slate-800/70">
                            <div className="flex items-center gap-6">
                              <span className="text-sm text-slate-500 dark:text-slate-400">Grand total</span>
                              <span className="text-lg font-bold text-slate-900 dark:text-white">{fmtMoney(invoice.grandTotal)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : invoices.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <CreditCard size={20} className="text-slate-400" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">No invoices yet</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Invoices issued to your organization will appear here.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {invoices.map((inv: any) => (
                      <button key={inv.id} onClick={() => setSelectedInvoiceId(inv.id)} className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Chip className={statusTone(inv.invoiceStatus)}>{inv.invoiceStatus || 'Open'}</Chip>
                          <span className="ml-auto text-[11px] text-slate-400">{formatDate(inv.createdAt)}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{inv.subject}</p>
                        <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{fmtMoney(inv.grandTotal)}</p>
                        <span className="mt-2 inline-flex items-center text-xs font-medium text-sky-600 dark:text-sky-400">
                          View line items <Eye size={12} className="ml-1" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Shared Documents</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Files your organization has shared with you.</p>
                </div>
                {documents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <FileText size={20} className="text-slate-400" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">No documents shared</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Shared files will show up here when available.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {documents.map((doc: any) => (
                      <div key={doc.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-500/15 flex items-center justify-center shrink-0">
                          <FileText size={18} className="text-sky-600 dark:text-sky-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{doc.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {doc.fileType || 'Document'} · {doc.fileVersion || 'v1'} · {formatDate(doc.createdAt)}
                          </p>
                        </div>
                        {doc.filePath && (
                          <a href={doc.filePath} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600 transition-colors" title="Download">
                            <Download size={16} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="profile" className="p-4 sm:p-6">
              <div className="max-w-lg space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Profile</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Keep your contact details up to date.</p>
                </div>
                <Card>
                  <CardContent className="pt-5">
                    <form onSubmit={e => { e.preventDefault(); updateProfileMutation.mutate(profileForm) }} className="space-y-4">
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <Avatar name={profileForm.name || portalUser?.name || '?'} className="h-12 w-12 text-lg" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{profileForm.name || '—'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{portalUser?.email}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                        <div className="relative mt-1">
                          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} className="pl-9" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                        <div className="relative mt-1">
                          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="pl-9" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company</label>
                        <div className="relative mt-1">
                          <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input value={profileForm.company} onChange={e => setProfileForm(p => ({ ...p, company: e.target.value }))} className="pl-9" />
                        </div>
                      </div>
                      <Button type="submit" size="sm" className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : null}
                        Save Profile
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </TabsRoot>
        </div>
      </div>

      <Dialog open={showTicketForm} onOpenChange={setShowTicketForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Ticket</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); createTicketMutation.mutate(ticketForm) }} className="space-y-3">
            <Input placeholder="Title" value={ticketForm.title} onChange={e => setTicketForm(f => ({ ...f, title: e.target.value }))} required />
            <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Describe the issue…" value={ticketForm.description} onChange={e => setTicketForm(f => ({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <select value={ticketForm.priority} onChange={e => setTicketForm(f => ({ ...f, priority: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="Low">Low priority</option>
                <option value="Normal">Normal priority</option>
                <option value="High">High priority</option>
                <option value="Urgent">Urgent</option>
              </select>
              <Input placeholder="Category" value={ticketForm.category} onChange={e => setTicketForm(f => ({ ...f, category: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowTicketForm(false)}>Cancel</Button>
              <Button type="submit" className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700" disabled={createTicketMutation.isPending}>
                {createTicketMutation.isPending ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : null}
                Create Ticket
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}