'use client'

import { formatDate, formatDateTime } from '@/lib/org-format'

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/lib/toast'
import { useTheme } from '@/lib/theme'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/ui/data-table'
import QRCode from 'qrcode'
import { cn } from '@/lib/utils'
import {
  Lock, User, Mail, Phone, FileText, Ticket, Loader2, LogOut, Plus, Send, Eye,
  ArrowLeft, Download, CreditCard, CheckCircle2, MessageSquare, ShieldCheck, Sun, Moon, Search, KeyRound, Store, Globe, LayoutGrid, List, MapPin,
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

function statusTextTone(status?: string | null): string {
  const s = (status || '').toLowerCase()
  if (/paid|resolved|closed|completed|approved|delivered/.test(s)) return 'text-emerald-600 dark:text-emerald-400'
  if (/overdue|urgent|cancelled|failed|declined|refunded|void/.test(s)) return 'text-rose-600 dark:text-rose-400'
  if (/in progress|waiting|pending|awaiting|partial/.test(s)) return 'text-amber-600 dark:text-amber-400'
  if (/draft|open|new|active/.test(s)) return 'text-sky-600 dark:text-sky-400'
  return 'text-slate-500 dark:text-slate-400'
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

interface PortalSupplier {
  name?: string
  logo?: string
  phone?: string
  email?: string
  website?: string
  address?: string
}

interface PortalManager {
  name?: string
  email?: string
}

interface PortalUser {
  id: string
  name: string
  email: string
  sharedBy?: string
  supplier?: PortalSupplier | null
  accountManager?: PortalManager | null
}

const KANBAN_ORDER = ['Open', 'In Progress', 'Wait for Response', 'Closed']
const INVOICE_KANBAN_ORDER = ['Open', 'Partial', 'Paid', 'Overdue', 'Cancelled']
const DOC_KANBAN_ORDER = ['PDF', 'Image', 'Spreadsheet', 'Document']

function kanbanDot(status: string): string {
  const s = status.toLowerCase()
  if (/closed|cancelled|resolved/.test(s)) return 'bg-slate-400'
  if (/wait|await|pending/.test(s)) return 'bg-blue-500'
  if (/progress|working/.test(s)) return 'bg-amber-500'
  if (/open|new|active/.test(s)) return 'bg-rose-500'
  return 'bg-sky-500'
}

function invoiceKanbanDot(status: string): string {
  const s = status.toLowerCase()
  if (/paid|approved|completed/.test(s)) return 'bg-emerald-500'
  if (/overdue|cancelled|refunded/.test(s)) return 'bg-rose-500'
  if (/partial|pending|awaiting/.test(s)) return 'bg-amber-500'
  if (/open|draft|new/.test(s)) return 'bg-sky-500'
  return 'bg-slate-400'
}

function docKanbanDot(fileType: string): string {
  const t = fileType.toLowerCase()
  if (/pdf/.test(t)) return 'bg-rose-500'
  if (/image|png|jpg|jpeg|gif/.test(t)) return 'bg-violet-500'
  if (/sheet|excel|xls|csv/.test(t)) return 'bg-emerald-500'
  if (/doc|word|txt|text/.test(t)) return 'bg-sky-500'
  return 'bg-slate-400'
}

function PortalKanban({ records, groupKey, dotClass, order, cardRender }: {
  records: any[]
  groupKey: string
  dotClass: (status: string) => string
  order?: string[]
  cardRender: (record: any) => ReactNode
}) {
  const groupOf = (r: any) => String(r[groupKey] || 'Other').trim() || 'Other'
  const groups = [...new Set(records.map(groupOf))].sort((a, b) => {
    const ai = order ? order.indexOf(a) : -1
    const bi = order ? order.indexOf(b) : -1
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.localeCompare(b)
  })

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-4 min-w-max">
        {groups.map((s) => {
          const items = records.filter((r: any) => groupOf(r) === s)
          return (
            <div key={s} className="flex-1 min-w-[280px] max-w-[300px]">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn('h-2 w-2 rounded-full', dotClass(s))} />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{s}</h3>
                  <span className="ml-auto text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {items.map((r: any) => (
                    <div key={r.id}>{cardRender(r)}</div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GlobalSearchResults({ query, tickets, invoices, documents, onSelectTicket, onSelectInvoice, onSelectDocuments }: {
  query: string
  tickets: any[]
  invoices: any[]
  documents: any[]
  onSelectTicket: (id: string) => void
  onSelectInvoice: (id: string) => void
  onSelectDocuments: () => void
}) {
  const q = query.toLowerCase()
  const matchT = tickets.filter((t: any) => [t.title, t.ticketNo, t.category, t.status, t.priority].some((v: any) => (v || '').toLowerCase().includes(q)))
  const matchI = invoices.filter((i: any) => [i.subject, i.invoiceNo, i.invoiceStatus].some((v: any) => (v || '').toLowerCase().includes(q)))
  const matchD = documents.filter((d: any) => [d.title, d.fileType, d.fileVersion].some((v: any) => (v || '').toLowerCase().includes(q)))
  const total = matchT.length + matchI.length + matchD.length
  if (!total) return null

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl max-h-80 overflow-y-auto">
      {matchT.length > 0 && (
        <div className="p-2">
          <p className="px-2 pb-1 text-[11px] uppercase tracking-wide text-slate-400 flex items-center gap-1"><Ticket size={12} /> Requests ({matchT.length})</p>
          {matchT.slice(0, 5).map((t: any) => (
            <button key={t.id} onClick={() => onSelectTicket(t.id)} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full shrink-0', kanbanDot(t.status))} />
              <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{t.title}</span>
              <span className="ml-auto text-[11px] text-slate-400 shrink-0">{t.status || 'Open'}</span>
            </button>
          ))}
        </div>
      )}
      {matchI.length > 0 && (
        <div className="p-2 border-t border-slate-100 dark:border-slate-800">
          <p className="px-2 pb-1 text-[11px] uppercase tracking-wide text-slate-400 flex items-center gap-1"><CreditCard size={12} /> Invoices ({matchI.length})</p>
          {matchI.slice(0, 5).map((i: any) => (
            <button key={i.id} onClick={() => onSelectInvoice(i.id)} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full shrink-0', invoiceKanbanDot(i.invoiceStatus))} />
              <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{i.subject}</span>
              <span className="ml-auto text-[11px] text-slate-400 shrink-0">{fmtMoney(i.grandTotal)}</span>
            </button>
          ))}
        </div>
      )}
      {matchD.length > 0 && (
        <div className="p-2 border-t border-slate-100 dark:border-slate-800">
          <p className="px-2 pb-1 text-[11px] uppercase tracking-wide text-slate-400 flex items-center gap-1"><FileText size={12} /> Documents ({matchD.length})</p>
          {matchD.slice(0, 5).map((d: any) => (
            <button key={d.id} onClick={onSelectDocuments} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full shrink-0', docKanbanDot(d.fileType))} />
              <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{d.title}</span>
              <span className="ml-auto text-[11px] text-slate-400 shrink-0">{d.fileType || 'Document'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function PortalPage() {
  const { addToast } = useToast()
  const { theme, toggleTheme } = useTheme()
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => typeof window === 'undefined' ? null : localStorage.getItem('portal_token'))
  const [portalUser, setPortalUser] = useState<PortalUser | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpLogin, setOtpLogin] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [activeTab, setActiveTab] = useState('tickets')
  const [ticketView, setTicketView] = useState<'table' | 'kanban'>('table')
  const [invoiceView, setInvoiceView] = useState<'table' | 'kanban'>('table')
  const [documentView, setDocumentView] = useState<'table' | 'kanban'>('table')
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketForm, setTicketForm] = useState({ title: '', description: '', priority: 'Normal', category: '' })
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' })
  const [ticketSearch, setTicketSearch] = useState('')
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [documentSearch, setDocumentSearch] = useState('')
  const [globalQuery, setGlobalQuery] = useState('')
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [securityEnabled, setSecurityEnabled] = useState(false)
  const [twoFactorData, setTwoFactorData] = useState<{ secret: string; otpauthUrl: string; qr?: string } | null>(null)
  const [setupCode, setSetupCode] = useState('')
  const [disableCode, setDisableCode] = useState('')

  const portalHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {}

  const loginMutation = useMutation({
    mutationFn: async () => {
      setLoggingIn(true)
      const res = await fetch(`${PORTAL_API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, otp: otpLogin || undefined }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Login failed') }
      return res.json()
    },
    onSettled: () => setLoggingIn(false),
    onSuccess: (data) => {
      localStorage.setItem('portal_token', data.data.token)
      setToken(data.data.token)
      setPortalUser(data.data.user)
      setProfileForm({ name: data.data.user.name, phone: '' })
      setRequires2FA(false)
      setOtpLogin('')
      addToast({ title: 'Welcome to your portal', variant: 'success' })
    },
    onError: (e: Error) => {
      if (/two-factor/i.test(e.message)) setRequires2FA(true)
      addToast({ title: 'Login failed', description: e.message, variant: 'destructive' })
    },
  })

  useEffect(() => {
    if (token && !portalUser) {
      fetch(`${PORTAL_API}/profile`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => { setPortalUser(d.data); setProfileForm({ name: d.data.name, phone: d.data.phone || '' }) })
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

  const { data: securityData } = useQuery({
    queryKey: ['portal-security'],
    queryFn: () => fetch(`${PORTAL_API}/security/status`, { headers: portalHeaders }).then(r => r.json()),
    enabled: !!token,
  })
  useEffect(() => {
    if (securityData?.data) setSecurityEnabled(!!securityData.data.enabled)
  }, [securityData])

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => fetch(`${PORTAL_API}/change-password`, { method: 'POST', headers: portalHeaders, body: JSON.stringify(data) }).then(async r => {
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Could not change password')
      return d
    }),
    onSuccess: () => { setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); addToast({ title: 'Password changed', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const twoFactorSetupMutation = useMutation({
    mutationFn: async () => {
      const d = await fetch(`${PORTAL_API}/security/setup`, { method: 'POST', headers: portalHeaders }).then(r => r.json())
      if (d.error) throw new Error(d.error)
      return d.data
    },
    onSuccess: async (data) => {
      if (data.alreadyEnabled) { setSecurityEnabled(true); setTwoFactorData(null); return }
      let qr: string | undefined
      try { qr = await QRCode.toDataURL(data.otpauthUrl, { width: 220, margin: 1 }) } catch { qr = undefined }
      setTwoFactorData({ secret: data.secret, otpauthUrl: data.otpauthUrl, qr })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const twoFactorEnableMutation = useMutation({
    mutationFn: async () => {
      const d = await fetch(`${PORTAL_API}/security/enable`, { method: 'POST', headers: portalHeaders, body: JSON.stringify({ code: setupCode }) }).then(r => r.json())
      if (d.error) throw new Error(d.error)
      return d.data
    },
    onSuccess: () => { setSecurityEnabled(true); setTwoFactorData(null); setSetupCode(''); addToast({ title: 'Two-factor authentication enabled', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const twoFactorDisableMutation = useMutation({
    mutationFn: async () => {
      const d = await fetch(`${PORTAL_API}/security/disable`, { method: 'POST', headers: portalHeaders, body: JSON.stringify({ code: disableCode }) }).then(r => r.json())
      if (d.error) throw new Error(d.error)
      return d.data
    },
    onSuccess: () => { setSecurityEnabled(false); setDisableCode(''); addToast({ title: 'Two-factor authentication disabled', variant: 'success' }) },
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
              {requires2FA && (
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Two-factor code</label>
                  <div className="relative mt-1">
                    <ShieldCheck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input inputMode="numeric" value={otpLogin} onChange={e => setOtpLogin(e.target.value)} placeholder="6-digit authenticator code" className="pl-9 h-11" autoFocus />
                  </div>
                </div>
              )}
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

  const q = ticketSearch.trim().toLowerCase()
  const filteredTickets = tickets.filter((t: any) => !q || [t.title, t.ticketNo, t.category, t.status, t.priority].some((v: any) => (v || '').toLowerCase().includes(q)))
  const qi = invoiceSearch.trim().toLowerCase()
  const filteredInvoices = invoices.filter((i: any) => !qi || [i.subject, i.invoiceNo, i.invoiceStatus].some((v: any) => (v || '').toLowerCase().includes(qi)))
  const qd = documentSearch.trim().toLowerCase()
  const filteredDocuments = documents.filter((d: any) => !qd || [d.title, d.fileType, d.fileVersion].some((v: any) => (v || '').toLowerCase().includes(qd)))

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
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950">
      <header className="sticky top-0 z-20 bg-white/85 dark:bg-slate-900/85 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/bizforce-mark.svg" alt="BizForce" className="h-8 w-8 rounded-lg shadow-sm" />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">Customer Portal</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {portalUser?.email || ''}{portalUser?.supplier?.name ? ` · ${portalUser.supplier.name}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={globalQuery} onChange={e => setGlobalQuery(e.target.value)} placeholder="Search everything…" className="pl-9 h-9 w-52 focus:w-72 transition-all" />
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle dark mode">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <div className="hidden sm:flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              <Avatar name={portalUser?.name || '?'} className="h-7 w-7 text-xs" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{portalUser?.name || ''}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut size={14} className="mr-1" /> Sign out
            </Button>
          </div>
        </div>
        {globalQuery.trim() && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-2">
            <GlobalSearchResults
              query={globalQuery.trim()}
              tickets={tickets}
              invoices={invoices}
              documents={documents}
              onSelectTicket={(id) => { setSelectedTicketId(id); setGlobalQuery(''); setActiveTab('tickets') }}
              onSelectInvoice={(id) => { setSelectedInvoiceId(id); setGlobalQuery(''); setActiveTab('invoices') }}
              onSelectDocuments={() => { setGlobalQuery(''); setActiveTab('documents') }}
            />
          </div>
        )}
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1 w-full">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-sky-300/20 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3">
              {portalUser?.supplier?.logo && (
                <img src={portalUser.supplier.logo} alt={portalUser.supplier.name || 'supplier'} className="h-10 w-10 rounded-xl bg-white/10 border border-white/15 object-cover" />
              )}
              <h2 className="text-2xl font-bold">Welcome back, {firstName}</h2>
            </div>
            <p className="mt-1 text-sm text-blue-100">
              {portalUser?.supplier?.name ? (
                <>
                  Your supplier: <span className="font-semibold text-white">{portalUser.supplier.name}</span>
                </>
              ) : (
                'Here is a quick snapshot of your account.'
              )}
              {portalUser?.accountManager?.name ? (
                <>
                  {' '}· Account manager: <span className="font-semibold text-white">{portalUser.accountManager.name}</span>
                </>
              ) : null}
            </p>
            {portalUser?.sharedBy ? (
              <p className="mt-1 text-xs text-blue-200/80">
                Portal access was shared with you by <span className="font-semibold text-white">{portalUser.sharedBy}</span>.
              </p>
            ) : null}
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
                <TabsTrigger value="supplier"><Store size={14} className="mr-1" /> Provider</TabsTrigger>
                <TabsTrigger value="profile"><User size={14} className="mr-1" /> Profile</TabsTrigger>
                <TabsTrigger value="settings"><ShieldCheck size={14} className="mr-1" /> Settings</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="tickets" className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Requests</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Track or start a support request.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input value={ticketSearch} onChange={e => setTicketSearch(e.target.value)} placeholder="Search requests…" className="pl-8 h-9 w-44" />
                    </div>
                    {tickets.length > 0 && (
                      <Button variant="outline" size="sm" onClick={() => setTicketView(v => v === 'table' ? 'kanban' : 'table')}>
                        {ticketView === 'table' ? <LayoutGrid size={14} className="mr-1" /> : <List size={14} className="mr-1" />}
                        {ticketView === 'table' ? 'Kanban' : 'Table'}
                      </Button>
                    )}
                    <Button size="sm" className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700" onClick={() => setShowTicketForm(true)}>
                      <Plus size={14} className="mr-1" /> New Ticket
                    </Button>
                  </div>
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
                        <Input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a reply…" className="h-10" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (commentText.trim()) addCommentMutation.mutate(commentText) } }} />
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
                ) : ticketView === 'table' ? (
                  <DataTable
                    columns={[
                      {
                        key: 'title',
                        label: 'Request',
                        render: (v: any, rec: any) => (
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white truncate">{v}</p>
                            {rec.category && <p className="text-xs text-slate-400">{rec.category}</p>}
                          </div>
                        ),
                      },
                      { key: 'status', label: 'Status', render: (v: any) => <Chip className={statusTone(v)}>{v || 'Open'}</Chip> },
                      { key: 'priority', label: 'Priority', render: (v: any) => <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{v || 'Normal'}</span> },
                      { key: 'createdAt', label: 'Opened', render: (v: any) => <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(v)}</span> },
                    ]}
                    data={filteredTickets}
                    onRowClick={(t: any) => setSelectedTicketId(t.id)}
                    emptyMessage="No requests yet."
                    pageSize={10}
                    actions={(t: any) => (
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTicketId(t.id)}>
                        <Eye size={13} className="mr-1" /> View
                      </Button>
                    )}
                  />
                ) : (
                  <PortalKanban
                    records={filteredTickets}
                    groupKey="status"
                    dotClass={kanbanDot}
                    order={KANBAN_ORDER}
                    cardRender={(t: any) => (
                      <button
                        onClick={() => setSelectedTicketId(t.id)}
                        className="w-full text-left rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn('text-[11px] font-medium', priorityText(t.priority))}>{t.priority || 'Normal'}</span>
                          {t.category && <span className="text-[11px] text-slate-400">{t.category}</span>}
                          <span className="ml-auto text-[11px] text-slate-400">{formatDate(t.createdAt)}</span>
                        </div>
                        <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{t.title}</p>
                        {t.description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{t.description}</p>}
                      </button>
                    )}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="invoices" className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invoices</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Your billing history and line-item details.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} placeholder="Search invoices…" className="pl-8 h-9 w-44" />
                    </div>
                    {invoices.length > 0 && (
                      <Button variant="outline" size="sm" className="self-start sm:self-auto" onClick={() => setInvoiceView(v => v === 'table' ? 'kanban' : 'table')}>
                        {invoiceView === 'table' ? <LayoutGrid size={14} className="mr-1" /> : <List size={14} className="mr-1" />}
                        {invoiceView === 'table' ? 'Kanban' : 'Table'}
                      </Button>
                    )}
                  </div>
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
                ) : invoiceView === 'table' ? (
                  <DataTable
                    columns={[
                      { key: 'subject', label: 'Invoice', render: (v: any) => <p className="font-medium text-slate-900 dark:text-white truncate">{v || 'Untitled'}</p> },
                      { key: 'invoiceStatus', label: 'Status', render: (v: any) => <Chip className={statusTone(v)}>{v || 'Open'}</Chip> },
                      { key: 'grandTotal', label: 'Amount', render: (v: any) => <span className="font-semibold text-slate-900 dark:text-white">{fmtMoney(v)}</span> },
                      { key: 'createdAt', label: 'Issued', render: (v: any) => <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(v)}</span> },
                    ]}
                    data={filteredInvoices}
                    onRowClick={(inv: any) => setSelectedInvoiceId(inv.id)}
                    emptyMessage="No invoices yet."
                    pageSize={10}
                    actions={(inv: any) => (
                      <Button variant="ghost" size="sm" onClick={() => setSelectedInvoiceId(inv.id)}>
                        <Eye size={13} className="mr-1" /> View
                      </Button>
                    )}
                  />
                ) : (
                  <PortalKanban
                    records={filteredInvoices}
                    groupKey="invoiceStatus"
                    dotClass={invoiceKanbanDot}
                    order={INVOICE_KANBAN_ORDER}
                    cardRender={(inv: any) => (
                      <button
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className="w-full text-left rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn('text-[11px] font-medium', statusTextTone(inv.invoiceStatus))}>{inv.invoiceStatus || 'Open'}</span>
                          <span className="ml-auto text-[11px] text-slate-400">{formatDate(inv.createdAt)}</span>
                        </div>
                        <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{inv.subject}</p>
                        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{fmtMoney(inv.grandTotal)}</p>
                      </button>
                    )}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Shared Documents</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Files your organization has shared with you.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input value={documentSearch} onChange={e => setDocumentSearch(e.target.value)} placeholder="Search documents…" className="pl-8 h-9 w-44" />
                    </div>
                    {documents.length > 0 && (
                      <Button variant="outline" size="sm" className="self-start sm:self-auto" onClick={() => setDocumentView(v => v === 'table' ? 'kanban' : 'table')}>
                        {documentView === 'table' ? <LayoutGrid size={14} className="mr-1" /> : <List size={14} className="mr-1" />}
                        {documentView === 'table' ? 'Kanban' : 'Table'}
                      </Button>
                    )}
                  </div>
                </div>
                {documents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <FileText size={20} className="text-slate-400" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">No documents shared</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Shared files will show up here when available.</p>
                  </div>
                ) : documentView === 'table' ? (
                  <DataTable
                    columns={[
                      { key: 'title', label: 'File', render: (v: any) => <p className="font-medium text-slate-900 dark:text-white truncate">{v || 'Untitled'}</p> },
                      { key: 'fileType', label: 'Type', render: (v: any) => <Chip className={statusTone(v)}>{v || 'Document'}</Chip> },
                      { key: 'fileVersion', label: 'Version', render: (v: any) => <span className="text-xs text-slate-500 dark:text-slate-400">{v || 'v1'}</span> },
                      { key: 'createdAt', label: 'Shared', render: (v: any) => <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(v)}</span> },
                    ]}
                    data={filteredDocuments}
                    onRowClick={(doc: any) => { if (doc.filePath) window.open(doc.filePath, '_blank') }}
                    emptyMessage="No documents shared yet."
                    pageSize={10}
                    actions={(doc: any) => doc.filePath ? (
                      <a href={doc.filePath} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-medium text-sky-600 hover:text-sky-700">
                        <Download size={13} className="mr-1" /> Download
                      </a>
                    ) : null}
                  />
                ) : (
                  <PortalKanban
                    records={filteredDocuments}
                    groupKey="fileType"
                    dotClass={docKanbanDot}
                    order={DOC_KANBAN_ORDER}
                    cardRender={(doc: any) => (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-md transition-all">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-500/15 flex items-center justify-center shrink-0">
                            <FileText size={15} className="text-sky-600 dark:text-sky-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{doc.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{doc.fileVersion || 'v1'} · {formatDate(doc.createdAt)}</p>
                          </div>
                        </div>
                        {doc.filePath && (
                          <a href={doc.filePath} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center text-[11px] font-medium text-sky-600 hover:text-sky-700">
                            <Download size={12} className="mr-1" /> Download
                          </a>
                        )}
                      </div>
                    )}
                  />
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
                          {portalUser?.sharedBy ? (
                            <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5">Portal access shared by {portalUser.sharedBy}</p>
                          ) : null}
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
                      <Button type="submit" size="sm" className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : null}
                        Save Profile
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="supplier" className="p-4 sm:p-6">
              <div className="max-w-lg space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Provider</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">The organization that serves your account.</p>
                </div>
                {portalUser?.supplier ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {portalUser.supplier.logo ? (
                          <img src={portalUser.supplier.logo} alt={portalUser.supplier.name || 'supplier'} className="h-16 w-16 rounded-2xl border border-slate-200 dark:border-slate-800 object-cover" />
                        ) : (
                          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shrink-0">
                            {(portalUser.supplier.name || 'S')[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-wide text-slate-400">Supplier</p>
                          <p className="text-xl font-bold text-slate-900 dark:text-white">{portalUser.supplier.name || '—'}</p>
                          {portalUser.sharedBy && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Portal access shared by {portalUser.sharedBy}</p>}
                        </div>
                      </div>
                      <div className="mt-5 space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-5">
                        {portalUser.supplier.address && (
                          <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" /> {portalUser.supplier.address}
                          </p>
                        )}
                        {portalUser.supplier.email && (
                          <a href={`mailto:${portalUser.supplier.email}`} className="flex items-center gap-2 text-sm text-sky-600 hover:underline">
                            <Mail size={15} className="shrink-0" /> {portalUser.supplier.email}
                          </a>
                        )}
                        {portalUser.supplier.phone && (
                          <a href={`tel:${portalUser.supplier.phone}`} className="flex items-center gap-2 text-sm text-sky-600 hover:underline">
                            <Phone size={15} className="shrink-0" /> {portalUser.supplier.phone}
                          </a>
                        )}
                        {portalUser.supplier.website && (
                          <a href={portalUser.supplier.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-sky-600 hover:underline">
                            <Globe size={15} className="shrink-0" /> {portalUser.supplier.website}
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
                    <Store size={20} className=" mx-auto text-slate-400" />
                    <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">No provider information yet</p>
                  </div>
                )}
                {portalUser?.accountManager?.name && (
                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-3">
                        <Avatar name={portalUser.accountManager.name} className="h-11 w-11 text-sm" />
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-slate-400">Your account manager</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{portalUser.accountManager.name}</p>
                          {portalUser.accountManager.email && <a href={`mailto:${portalUser.accountManager.email}`} className="text-xs text-sky-600 hover:underline">{portalUser.accountManager.email}</a>}
                        </div>
                      </div>
                      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Your account manager is your point of contact for anything related to your account with {portalUser.supplier?.name || 'your provider'}.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="p-4 sm:p-6">
              <div className="max-w-lg space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Settings</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Appearance, password and security.</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Appearance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Switch between light and dark theme.</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={toggleTheme}>
                        {theme === 'dark' ? <Sun size={14} className="mr-1" /> : <Moon size={14} className="mr-1" />}
                        {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Change password</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={e => { e.preventDefault(); changePasswordMutation.mutate(passwordForm) }} className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Current access code</label>
                        <div className="relative mt-1">
                          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} placeholder="••••••••" className="pl-9" required />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New access code</label>
                        <div className="relative mt-1">
                          <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="At least 6 characters" className="pl-9" required minLength={6} />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm new access code</label>
                        <div className="relative mt-1">
                          <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Re-enter new code" className="pl-9" required />
                        </div>
                      </div>
                      {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                        <p className="text-xs text-rose-600 dark:text-rose-400">Passwords do not match.</p>
                      )}
                      <Button type="submit" size="sm" className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700" disabled={changePasswordMutation.isPending || (!!passwordForm.newPassword && passwordForm.newPassword !== passwordForm.confirmPassword)}>
                        {changePasswordMutation.isPending ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : null}
                        Update password
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><ShieldCheck size={16} /> Two-factor authentication</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!securityEnabled && !twoFactorData && (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Add an extra layer of security. You will need a code from an authenticator app
                          (like Google Authenticator or Authy) each time you sign in.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => twoFactorSetupMutation.mutate()} disabled={twoFactorSetupMutation.isPending}>
                          {twoFactorSetupMutation.isPending ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : <ShieldCheck size={14} className="mr-1" />}
                          Enable two-factor authentication
                        </Button>
                      </div>
                    )}
                    {!securityEnabled && twoFactorData && (
                      <div className="space-y-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Scan the QR code with your authenticator app, or manually enter the secret below.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                          {twoFactorData.qr && (
                            <img src={twoFactorData.qr} alt="QR code" className="w-44 h-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white p-2" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] uppercase tracking-wide text-slate-400">Setup secret</p>
                            <code className="mt-1 block break-all rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 select-all">{twoFactorData.secret}</code>
                            <p className="text-[11px] text-slate-400 mt-1">Manual entry — account type TOTP, time based.</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Enter the 6-digit code from your app</label>
                          <Input inputMode="numeric" value={setupCode} onChange={e => setSetupCode(e.target.value)} placeholder="123456" className="mt-1" />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700" disabled={twoFactorEnableMutation.isPending || setupCode.length < 6} onClick={() => twoFactorEnableMutation.mutate()}>
                            {twoFactorEnableMutation.isPending ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : null}
                            Confirm & enable
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setTwoFactorData(null)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                    {securityEnabled && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                          <p className="text-sm font-medium text-slate-900 dark:text-white">Two-factor authentication is enabled</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Enter your current authenticator code to disable</label>
                          <Input inputMode="numeric" value={disableCode} onChange={e => setDisableCode(e.target.value)} placeholder="123456" className="mt-1" />
                        </div>
                        <Button variant="outline" size="sm" disabled={twoFactorDisableMutation.isPending || disableCode.length < 6} onClick={() => twoFactorDisableMutation.mutate()}>
                          {twoFactorDisableMutation.isPending ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : null}
                          Disable two-factor authentication
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </TabsRoot>
        </div>
      </div>

      <footer className="sticky bottom-0 z-10 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Powered by{' '}
            <a href="https://bizforce-crm.online" target="_blank" rel="noreferrer" className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">bizforce-crm.online</a>
          </span>
        </div>
      </footer>

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