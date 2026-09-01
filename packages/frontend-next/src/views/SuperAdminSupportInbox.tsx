'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Building2, CheckCircle2, Headphones, Info, Loader2, Search, Send, UserRound, Wifi, WifiOff, X } from 'lucide-react'
import { api } from '@/lib/api'
import { createSupportMessageId, useSupportSocket } from '@/hooks/useSupportSocket'
import { useNavigate } from '@/lib/navigation'
import { useAuthStore } from '@/lib/auth'

const filters: Record<string, string[]> = {
  All: [], Waiting: ['WAITING_FOR_AGENT'], Assigned: ['AGENT_ASSIGNED'], Active: ['AGENT_ACTIVE'], Resolved: ['RESOLVED', 'CLOSED'],
}
const priorityClass: Record<string, string> = { URGENT: 'bg-red-100 text-red-700', HIGH: 'bg-orange-100 text-orange-700', NORMAL: 'bg-blue-100 text-blue-700', LOW: 'bg-slate-100 text-slate-600' }

const statusMeta: Record<string, { label: string; dot: string; text: string }> = {
  WAITING_FOR_AGENT: { label: 'Waiting', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' },
  AGENT_ASSIGNED: { label: 'Assigned', dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400' },
  AGENT_ACTIVE: { label: 'Active', dot: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-400' },
  RESOLVED: { label: 'Resolved', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  CLOSED: { label: 'Closed', dot: 'bg-slate-400', text: 'text-slate-500' },
}

function sameMessages(current: any[], next: any[]) {
  return current.length === next.length && current.every((message, index) => {
    const candidate = next[index]
    return message.id === candidate?.id && message.content === candidate.content && message.createdAt === candidate.createdAt && message.senderType === candidate.senderType
  })
}

export function SuperAdminSupportInbox() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [messageLoading, setMessageLoading] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [customerTyping, setCustomerTyping] = useState(false)
  const [stats, setStats] = useState<any>({})
  const [agents, setAgents] = useState<any[]>([])
  const [showContext, setShowContext] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const conversationRequestRef = useRef(0)

  const loadList = useCallback(async () => {
    const params: Record<string, string> = { limit: '50' }
    if (search.trim()) params.search = search.trim()
    const response = await api.adminSupportList(params)
    setItems(response.data || [])
    api.adminSupportStats().then(r => setStats(r.data || {})).catch(() => {})
  }, [search])

  const loadConversation = useCallback(async (id: string, showLoading = false) => {
    const requestId = ++conversationRequestRef.current
    if (showLoading) setMessageLoading(true)
    try {
      const [detail, messageResponse] = await Promise.all([api.adminSupportGet(id), api.adminSupportMessages(id)])
      if (requestId !== conversationRequestRef.current) return
      setSelected(detail.data)
      const nextMessages = messageResponse.data || []
      setMessages(current => sameMessages(current, nextMessages) ? current : nextMessages)
    } finally {
      if (showLoading && requestId === conversationRequestRef.current) setMessageLoading(false)
    }
  }, [])

  useEffect(() => { api.adminSupportAgents().then(r => setAgents(r.data || [])).catch(() => {}) }, [])
  useEffect(() => { const timer = window.setTimeout(() => { setLoading(true); loadList().catch((e: any) => setError(e.message)).finally(() => setLoading(false)) }, 250); return () => clearTimeout(timer) }, [loadList])
  useEffect(() => { const id = new URLSearchParams(location.search).get('id'); if (id) loadConversation(id, true).catch(() => {}) }, [loadConversation])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, customerTyping])

  const onSocketEvent = useCallback((event: any) => {
    if (event.event === 'customer.typing') { const typing = !!event.payload?.typing; setCustomerTyping(typing); if (typing) window.setTimeout(() => setCustomerTyping(false), 2500); return }
    loadList().catch(() => {})
    if (selected?.id && event.conversationId === selected.id) loadConversation(selected.id).catch(() => {})
  }, [loadConversation, loadList, selected?.id])
  const { connected, sendTyping } = useSupportSocket(selected?.id || null, onSocketEvent)

  useEffect(() => {
    // Periodically reconcile with the database even while connected. WebSocket
    // delivery is intentionally not the source of truth and a reconnect can
    // otherwise leave a newly assigned conversation out of the inbox.
    const timer = window.setInterval(() => {
      loadList().catch(() => {})
      if (selected?.id) loadConversation(selected.id).catch(() => {})
    }, connected ? 15_000 : 5_000)
    return () => window.clearInterval(timer)
  }, [connected, loadConversation, loadList, selected?.id])

  const visible = useMemo(() => items.filter(item => !filters[activeFilter].length || filters[activeFilter].includes(item.status)), [items, activeFilter])

  async function action(fn: () => Promise<any>) {
    setBusy(true); setError('')
    try { await fn(); await loadList(); if (selected) await loadConversation(selected.id) }
    catch (e: any) { setError(e.message || 'Action failed') }
    finally { setBusy(false) }
  }
  async function send() {
    const value = text.trim(); if (!value || !selected) return
    setText(''); await action(() => api.adminSupportSend(selected.id, value, createSupportMessageId()))
  }

  const filterCount = (label: string) => !filters[label].length ? items.length : items.filter(item => filters[label].includes(item.status)).length

  return <div className="relative isolate flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/60 p-2.5 dark:from-slate-950 dark:via-indigo-950/20 dark:to-violet-950/20 sm:gap-4 sm:p-4 lg:p-5">
    <div className="pointer-events-none absolute -right-24 -top-28 -z-10 h-72 w-72 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-700/10"/>
    <div className="pointer-events-none absolute -bottom-32 left-1/4 -z-10 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-700/10"/>
    <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 rounded-2xl border border-white/80 bg-white/75 px-3.5 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 sm:px-5 sm:py-4">
      <div className="min-w-0"><div className="mb-1 flex items-center gap-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20"><Headphones size={16}/></span><h1 className="truncate text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">Support Inbox</h1></div><p className="hidden text-sm text-muted-foreground sm:block">AI escalations and live organisation support, in one conversation.</p></div>
      <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
        <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${connected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'}`}>{connected ? <Wifi size={14}/> : <WifiOff size={14}/>} {connected ? 'Live' : 'Reconnecting'}</div>
        <div className="grid flex-1 grid-cols-3 gap-2 sm:flex-none">{[['Waiting', stats.WAITING_FOR_AGENT || 0, 'bg-amber-500'], ['Active', (stats.AGENT_ACTIVE || 0) + (stats.AGENT_ASSIGNED || 0), 'bg-blue-600'], ['Resolved', (stats.RESOLVED || 0) + (stats.CLOSED || 0), 'bg-emerald-600']].map(([label, count, dot]) => <div key={String(label)} className="min-w-0 rounded-xl border bg-card px-2.5 py-2 shadow-sm sm:min-w-[82px] sm:px-3"><p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground"><span className={`h-1.5 w-1.5 rounded-sm ${dot}`}/>{label}</p><p className="mt-0.5 text-xl font-extrabold">{count}</p></div>)}</div>
      </div>
    </div>
    <div className="relative z-0 grid min-h-0 flex-1 gap-2.5 sm:gap-3 md:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] xl:grid-cols-[minmax(280px,328px)_minmax(360px,1fr)_minmax(250px,292px)]">
      <aside className={`${selected ? 'hidden md:flex' : 'flex'} min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-white/80 bg-card/95 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-white/10`}>
        <div className="border-b p-3.5"><div className="relative"><Search className="absolute left-3 top-2.5 text-muted-foreground" size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search organisation, user, message…" className="h-9 w-full rounded-lg border bg-muted/40 pl-9 pr-3 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10"/></div><div className="mt-3 flex gap-1 overflow-x-auto">{Object.keys(filters).map(label => <button key={label} onClick={() => setActiveFilter(label)} className={`shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition ${activeFilter === label ? 'bg-violet-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>{label} <span className="opacity-70">{filterCount(label)}</span></button>)}</div></div>
        <div className="flex-1 overflow-y-auto overscroll-contain">{loading ? <div className="p-2">{[1,2,3,4].map(i => <div key={i} className="mb-2 h-24 animate-pulse rounded-xl bg-muted"/>)}</div> : visible.length === 0 ? <div className="grid h-full place-items-center p-8 text-center"><div><CheckCircle2 className="mx-auto mb-2 text-emerald-500"/><p className="font-medium">No conversations found</p><p className="text-xs text-muted-foreground">You’re all caught up.</p></div></div> : visible.map(item => { const meta = statusMeta[item.status] || statusMeta.CLOSED; return <button key={item.id} onClick={() => loadConversation(item.id, true)} className={`relative w-full border-b p-3.5 text-left transition ${selected?.id === item.id ? 'bg-violet-50 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-violet-600 dark:bg-violet-950/30' : 'hover:bg-muted/50'}`}><div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-400 text-sm font-bold text-white">{(item.company?.name || 'O')[0].toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="truncate text-[13px] font-bold">{item.company?.name || 'Organisation'}</p><span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${priorityClass[item.priority]}`}>{item.priority === 'NORMAL' ? 'Normal' : item.priority}</span></div><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.subject}</p><p className="mt-1.5 truncate text-xs text-muted-foreground">{item.messages?.[0]?.content || 'No messages yet'}</p><div className="mt-2 flex items-center justify-between gap-2"><span className={`flex items-center gap-1 text-[10px] font-semibold ${meta.text}`}><span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}/>{item.status === 'AGENT_ASSIGNED' && item.assignedAgentId === user?.id ? 'Assigned to you' : meta.label}</span><span className="shrink-0 text-[10px] text-muted-foreground">{new Date(item.lastMessageAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div></div></div></button> })}</div>
      </aside>
      <main className={`${!selected ? 'hidden md:flex' : 'flex'} min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-white/80 bg-card/95 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-white/10`}>
        {!selected ? <div className="m-auto text-center"><Headphones className="mx-auto mb-3 text-indigo-500" size={42}/><h2 className="font-semibold">Select a conversation</h2><p className="text-sm text-muted-foreground">Open a request to see its complete AI and human history.</p></div> : <>
          <header className="border-b p-3.5 sm:p-4">
            <div className="flex min-w-0 items-center gap-2">
              <button onClick={() => setSelected(null)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border md:hidden" aria-label="Back to conversations"><ArrowLeft size={16}/></button>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-400 text-sm font-bold text-white">{(selected.company?.name || 'O')[0].toUpperCase()}</div>
              <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-extrabold sm:text-base">{selected.company?.name}</h2><p className="truncate text-[11px] text-muted-foreground sm:text-xs">{selected.subject} · {(statusMeta[selected.status] || statusMeta.CLOSED).label}</p></div>
              <button type="button" onClick={() => setShowContext(true)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border hover:bg-muted xl:hidden" aria-label="Customer details"><Info size={16}/></button>
            </div>
            <div className="mt-2 flex w-full gap-2 overflow-x-auto pb-0.5">
              <select aria-label="Priority" value={selected.priority} onChange={e => action(() => api.adminSupportPriority(selected.id, e.target.value))} className="h-9 shrink-0 rounded-lg border bg-background px-2 text-xs font-semibold">{['LOW','NORMAL','HIGH','URGENT'].map(p => <option key={p}>{p}</option>)}</select>
              {['AGENT_ASSIGNED','AGENT_ACTIVE'].includes(selected.status) && agents.length > 0 && <select aria-label="Transfer conversation" value={selected.assignedAgentId || ''} onChange={e => e.target.value && action(() => api.adminSupportTransfer(selected.id, e.target.value))} className="h-9 min-w-32 max-w-44 shrink-0 rounded-lg border bg-background px-2 text-xs"><option value="">Transfer…</option>{agents.map(agent => <option key={agent.id} value={agent.id}>{[agent.firstName, agent.lastName].filter(Boolean).join(' ') || agent.email}{agent.online ? ' • Online' : ''}</option>)}</select>}
              {selected.status === 'WAITING_FOR_AGENT' && <button disabled={busy} onClick={() => action(() => api.adminSupportClaim(selected.id))} className="h-9 shrink-0 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white">Accept conversation</button>}
              {selected.status === 'AGENT_ASSIGNED' && selected.assignedAgentId === user?.id && <button disabled={busy} onClick={() => action(() => api.adminSupportAccept(selected.id))} className="h-9 shrink-0 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white disabled:opacity-60">{busy ? 'Accepting…' : 'Accept assigned chat'}</button>}
              {selected.status === 'AGENT_ACTIVE' && <button disabled={busy} onClick={() => action(() => api.adminSupportResolve(selected.id))} className="h-9 shrink-0 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white">Resolve</button>}
              {['RESOLVED','CLOSED'].includes(selected.status) && <button disabled={busy} onClick={() => action(() => api.adminSupportReopen(selected.id))} className="h-9 shrink-0 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white">Reopen</button>}
            </div>
          </header>
          <div className="flex-1 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] bg-[length:20px_20px] bg-muted/20 p-3 sm:p-5">{messageLoading ? <div className="grid h-full place-items-center"><Loader2 className="animate-spin"/></div> : messages.map(message => { const agent = message.senderType === 'AGENT'; const customer = message.senderType === 'CUSTOMER'; if (message.senderType === 'SYSTEM') return <div key={message.id} className="my-4 flex items-center justify-center gap-2 text-center text-[10px] font-semibold text-amber-700"><span className="h-px w-8 bg-amber-300"/><span className="max-w-[80%]">{message.content}</span><span className="h-px w-8 bg-amber-300"/></div>; return <div key={message.id} className={`mb-4 flex gap-2 ${agent ? 'flex-row-reverse' : ''}`}><div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg sm:h-8 sm:w-8 ${customer ? 'bg-slate-400 text-white' : message.senderType === 'AI' ? 'bg-gradient-to-br from-violet-600 to-indigo-400 text-white' : 'bg-slate-800 text-white'}`}>{customer ? <UserRound size={15}/> : message.senderType === 'AI' ? 'AI' : <Headphones size={15}/>}</div><div className={`min-w-0 max-w-[86%] sm:max-w-[74%] ${agent ? 'text-right' : ''}`}><p className="mb-1 truncate text-[10px] font-medium text-muted-foreground">{customer ? 'Customer' : message.senderType === 'AI' ? 'AI Assistant' : 'Super Admin'} · {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><div className={`whitespace-pre-wrap break-words rounded-2xl border px-3 py-2.5 text-left text-[13px] leading-relaxed shadow-sm ${agent ? 'rounded-br-sm border-violet-600 bg-violet-600 text-white' : message.senderType === 'AI' ? 'rounded-bl-sm border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/50' : 'rounded-bl-sm bg-card'}`}>{message.content}</div></div></div>})}{customerTyping && <p className="text-xs text-muted-foreground">Customer is typing…</p>}<div ref={bottomRef}/></div>
          <footer className="shrink-0 border-t bg-card px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">{error && <p className="mb-2 text-xs text-red-600">{error}</p>}{selected.status === 'AGENT_ACTIVE' ? <div className="flex items-end gap-2 rounded-2xl border bg-muted/30 p-2 pl-3 focus-within:border-violet-400"><textarea rows={1} value={text} onChange={e => { setText(e.target.value); sendTyping(true, true) }} onBlur={() => sendTyping(false, true)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder={`Reply to ${selected.company?.name || 'customer'}…`} className="max-h-28 min-h-9 min-w-0 flex-1 resize-y bg-transparent py-2 text-sm outline-none"/><button onClick={send} disabled={!text.trim() || busy} aria-label="Send reply" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-600 text-white disabled:opacity-50"><Send size={17}/></button></div> : <div className="rounded-xl bg-muted/60 px-4 py-3 text-center text-xs text-muted-foreground">{selected.status === 'AGENT_ASSIGNED' ? selected.assignedAgentId === user?.id ? 'Accept this assigned chat to start replying.' : 'This chat is assigned to another agent.' : ['RESOLVED','CLOSED'].includes(selected.status) ? 'This conversation is resolved — reopen it to keep replying.' : 'Accept this conversation to reply.'}</div>}</footer>
        </>}
      </main>
      <aside className="hidden min-h-0 overflow-y-auto overscroll-contain rounded-2xl border border-white/80 bg-card/95 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 xl:block">{selected && <CustomerContext selected={selected} isSuperAdmin={!!user?.isSuperAdmin} onOrganisation={() => navigate(`/superadmin/organizations?id=${selected.companyId}`)}/>}</aside>
    </div>
    {showContext && selected && <div className="fixed inset-0 z-[100] flex items-end bg-slate-950/45 p-0 sm:items-center sm:justify-center sm:p-4" onMouseDown={event => { if (event.target === event.currentTarget) setShowContext(false) }}><section role="dialog" aria-modal="true" aria-label="Customer context" className="max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl bg-background p-5 shadow-2xl sm:max-w-sm sm:rounded-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Customer details</h2><button type="button" onClick={() => setShowContext(false)} className="grid h-8 w-8 place-items-center rounded-lg border" aria-label="Close"><X size={15}/></button></div><CustomerContext selected={selected} isSuperAdmin={!!user?.isSuperAdmin} onOrganisation={() => { setShowContext(false); navigate(`/superadmin/organizations?id=${selected.companyId}`) }}/></section></div>}
  </div>
}

function CustomerContext({ selected, isSuperAdmin, onOrganisation }: { selected: any; isSuperAdmin: boolean; onOrganisation: () => void }) {
  const rows = [
    ['Admin', [selected.customer?.firstName, selected.customer?.lastName].filter(Boolean).join(' ') || 'Unknown'],
    ['Email', selected.customer?.email || 'Not provided'],
    ['Users', selected.company?._count?.users || 0],
    ['Organisation status', selected.company?.isActive ? 'Active' : 'Inactive'],
    ['Assigned agent', [selected.assignedAgent?.firstName, selected.assignedAgent?.lastName].filter(Boolean).join(' ') || 'Unassigned'],
  ]
  return <>
    <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300"><Building2 size={22}/></div>
    {isSuperAdmin ? <button onClick={onOrganisation} className="text-left text-[15px] font-extrabold text-violet-700 hover:underline dark:text-violet-300">{selected.company?.name}</button> : <h3 className="text-[15px] font-extrabold">{selected.company?.name}</h3>}
    <p className="mt-1 break-all text-[11px] text-violet-600 dark:text-violet-400">{selected.company?.email}</p>
    <p className="mb-2 mt-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Customer context</p>
    <dl>{rows.map(([label, value]) => <div key={String(label)} className="border-b py-2.5 last:border-0"><dt className="text-[10px] text-muted-foreground">{label}</dt><dd className="mt-0.5 break-all text-xs font-semibold">{value}</dd></div>)}</dl>
    {isSuperAdmin && <button onClick={onOrganisation} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted"><Building2 size={14}/>View organisation</button>}
  </>
}
