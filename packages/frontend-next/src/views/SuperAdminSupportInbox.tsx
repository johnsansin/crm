'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Building2, CheckCircle2, Clock3, Headphones, Loader2, Search, Send, UserRound, Wifi, WifiOff } from 'lucide-react'
import { api } from '@/lib/api'
import { createSupportMessageId, useSupportSocket } from '@/hooks/useSupportSocket'
import { useNavigate } from '@/lib/navigation'
import { useAuthStore } from '@/lib/auth'

const filters: Record<string, string[]> = {
  All: [], Waiting: ['WAITING_FOR_AGENT'], Assigned: ['AGENT_ASSIGNED'], Active: ['AGENT_ACTIVE'], Resolved: ['RESOLVED', 'CLOSED'],
}
const priorityClass: Record<string, string> = { URGENT: 'bg-red-100 text-red-700', HIGH: 'bg-orange-100 text-orange-700', NORMAL: 'bg-blue-100 text-blue-700', LOW: 'bg-slate-100 text-slate-600' }

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

  return <div className="flex h-full min-h-0 flex-col gap-2 p-2 sm:gap-3 sm:p-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-bold tracking-tight">Support Inbox</h1><p className="mt-1 text-sm text-muted-foreground">AI escalations and live organisation support in one conversation.</p></div>
      <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{connected ? <Wifi size={14}/> : <WifiOff size={14}/>} {connected ? 'Live' : 'Reconnecting'}</div>
    </div>
    <div className="grid grid-cols-3 gap-2 sm:max-w-lg">{[['Waiting', stats.WAITING_FOR_AGENT || 0], ['Active', (stats.AGENT_ACTIVE || 0) + (stats.AGENT_ASSIGNED || 0)], ['Resolved', (stats.RESOLVED || 0) + (stats.CLOSED || 0)]].map(([label, count]) => <div key={String(label)} className="rounded-xl border bg-card px-2 py-2 sm:p-3"><p className="truncate text-[9px] font-semibold uppercase text-muted-foreground sm:text-[11px]">{label}</p><p className="text-lg font-bold sm:text-xl">{count}</p></div>)}</div>
    <div className="grid min-h-0 flex-1 overflow-hidden rounded-xl border bg-card shadow-sm sm:rounded-2xl md:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(360px,1fr)_260px]">
      <aside className={`${selected ? 'hidden md:flex' : 'flex'} min-h-0 min-w-0 flex-col border-r`}>
        <div className="border-b p-3"><div className="relative"><Search className="absolute left-3 top-2.5 text-muted-foreground" size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search organisation, user, message…" className="h-9 w-full rounded-xl border bg-muted/30 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"/></div><div className="mt-3 flex gap-1 overflow-x-auto">{Object.keys(filters).map(label => <button key={label} onClick={() => setActiveFilter(label)} className={`rounded-full px-3 py-1 text-xs font-semibold ${activeFilter === label ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground'}`}>{label}</button>)}</div></div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-2">{loading ? [1,2,3,4].map(i => <div key={i} className="mb-2 h-24 animate-pulse rounded-xl bg-muted"/>) : visible.length === 0 ? <div className="grid h-full place-items-center p-8 text-center"><div><CheckCircle2 className="mx-auto mb-2 text-emerald-500"/><p className="font-medium">No conversations found</p><p className="text-xs text-muted-foreground">You’re all caught up.</p></div></div> : visible.map(item => <button key={item.id} onClick={() => loadConversation(item.id, true)} className={`mb-1 w-full rounded-xl border p-3 text-left transition ${selected?.id === item.id ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30' : 'border-transparent hover:bg-muted'}`}><div className="flex items-start justify-between gap-2"><p className="truncate text-sm font-semibold">{item.company?.name || 'Organisation'}</p><span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${priorityClass[item.priority]}`}>{item.priority}</span></div><p className="mt-1 truncate text-xs font-medium">{item.subject}</p><p className="mt-1 truncate text-xs text-muted-foreground">{item.messages?.[0]?.content}</p><div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground"><span className="truncate">{item.status === 'AGENT_ASSIGNED' && item.assignedAgentId === user?.id ? 'ASSIGNED TO YOU' : item.status.replaceAll('_', ' ')}</span><span className="shrink-0">{new Date(item.lastMessageAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div></button>)}</div>
      </aside>
      <main className={`${!selected ? 'hidden md:flex' : 'flex'} min-h-0 min-w-0 flex-col`}>
        {!selected ? <div className="m-auto text-center"><Headphones className="mx-auto mb-3 text-indigo-500" size={42}/><h2 className="font-semibold">Select a conversation</h2><p className="text-sm text-muted-foreground">Open a request to see its complete AI and human history.</p></div> : <>
          <header className="border-b p-2.5 sm:p-3">
            <div className="flex min-w-0 items-center gap-2">
              <button onClick={() => setSelected(null)} className="shrink-0 rounded-lg border px-2.5 py-1.5 text-xs md:hidden">Back</button>
              <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold sm:text-base">{selected.company?.name}</h2><p className="truncate text-[11px] text-muted-foreground sm:text-xs">{selected.subject} · {selected.status.replaceAll('_', ' ')}</p></div>
              <button type="button" onClick={() => setShowContext(true)} className="shrink-0 rounded-lg border px-2.5 py-1.5 text-xs xl:hidden">Details</button>
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
          <div className="flex-1 overflow-y-auto overscroll-contain bg-muted/20 p-2.5 sm:p-4">{messageLoading ? <div className="grid h-full place-items-center"><Loader2 className="animate-spin"/></div> : messages.map(message => { const agent = message.senderType === 'AGENT'; const customer = message.senderType === 'CUSTOMER'; if (message.senderType === 'SYSTEM') return <div key={message.id} className="my-3 text-center"><span className="inline-block max-w-full break-words rounded-xl bg-amber-50 px-3 py-1 text-[11px] text-amber-700">{message.content}</span></div>; return <div key={message.id} className={`mb-4 flex gap-2 ${agent ? 'flex-row-reverse' : ''}`}><div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full sm:h-8 sm:w-8 ${customer ? 'bg-blue-100 text-blue-700' : message.senderType === 'AI' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>{customer ? <UserRound size={15}/> : message.senderType === 'AI' ? 'AI' : <Headphones size={15}/>}</div><div className={`min-w-0 max-w-[84%] sm:max-w-[75%] ${agent ? 'text-right' : ''}`}><p className="mb-1 truncate text-[10px] font-semibold text-muted-foreground">{customer ? 'Customer' : message.senderType === 'AI' ? 'AI Assistant' : 'Agent'} · {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><div className={`whitespace-pre-wrap break-words rounded-2xl border px-3 py-2.5 text-left text-sm ${agent ? 'rounded-tr-sm border-indigo-600 bg-indigo-600 text-white' : 'rounded-tl-sm bg-card'}`}>{message.content}</div></div></div>})}{customerTyping && <p className="text-xs text-muted-foreground">Customer is typing…</p>}<div ref={bottomRef}/></div>
          <footer className="shrink-0 border-t px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{error && <p className="mb-2 text-xs text-red-600">{error}</p>}{selected.status === 'AGENT_ACTIVE' ? <div className="flex items-end gap-2"><textarea rows={1} value={text} onChange={e => { setText(e.target.value); sendTyping(true, true) }} onBlur={() => sendTyping(false, true)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Type a reply…" className="max-h-28 min-h-11 min-w-0 flex-1 resize-y rounded-xl border bg-muted/30 px-3 py-3 text-sm outline-none focus:border-indigo-400"/><button onClick={send} disabled={!text.trim() || busy} aria-label="Send reply" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white disabled:opacity-50"><Send size={18}/></button></div> : <p className="text-center text-xs text-muted-foreground">{selected.status === 'AGENT_ASSIGNED' ? selected.assignedAgentId === user?.id ? 'Accept this assigned chat to start replying.' : 'This chat is assigned to another agent.' : 'Accept this conversation to reply.'}</p>}</footer>
        </>}
      </main>
      <aside className="hidden overflow-y-auto border-l p-4 xl:block">{selected && <CustomerContext selected={selected} isSuperAdmin={!!user?.isSuperAdmin} onOrganisation={() => navigate(`/superadmin/organizations?id=${selected.companyId}`)}/>}</aside>
    </div>
    {showContext && selected && <div className="fixed inset-0 z-[100] flex items-end bg-slate-950/45 p-0 sm:items-center sm:justify-center sm:p-4" onMouseDown={event => { if (event.target === event.currentTarget) setShowContext(false) }}><section role="dialog" aria-modal="true" aria-label="Customer context" className="max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl bg-background p-5 shadow-2xl sm:max-w-sm sm:rounded-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Customer details</h2><button type="button" onClick={() => setShowContext(false)} className="rounded-lg border px-3 py-1.5 text-xs">Close</button></div><CustomerContext selected={selected} isSuperAdmin={!!user?.isSuperAdmin} onOrganisation={() => { setShowContext(false); navigate(`/superadmin/organizations?id=${selected.companyId}`) }}/></section></div>}
  </div>
}

function CustomerContext({ selected, isSuperAdmin, onOrganisation }: { selected: any; isSuperAdmin: boolean; onOrganisation: () => void }) {
  return <><p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer context</p><div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-700"><Building2/></div>{isSuperAdmin ? <button onClick={onOrganisation} className="text-left font-semibold text-indigo-700 hover:underline dark:text-indigo-300">{selected.company?.name}</button> : <h3 className="font-semibold">{selected.company?.name}</h3>}<p className="break-all text-xs text-muted-foreground">{selected.company?.email}</p><dl className="mt-5 grid grid-cols-2 gap-4 text-xs xl:grid-cols-1"><div><dt className="text-muted-foreground">Admin</dt><dd className="font-medium">{[selected.customer?.firstName, selected.customer?.lastName].filter(Boolean).join(' ') || 'Unknown'}</dd></div><div><dt className="text-muted-foreground">Email</dt><dd className="break-all font-medium">{selected.customer?.email}</dd></div><div><dt className="text-muted-foreground">Users</dt><dd className="font-medium">{selected.company?._count?.users || 0}</dd></div><div><dt className="text-muted-foreground">Organisation status</dt><dd className="font-medium">{selected.company?.isActive ? 'Active' : 'Inactive'}</dd></div><div><dt className="text-muted-foreground">Assigned agent</dt><dd className="font-medium">{[selected.assignedAgent?.firstName, selected.assignedAgent?.lastName].filter(Boolean).join(' ') || 'Unassigned'}</dd></div></dl></>
}
