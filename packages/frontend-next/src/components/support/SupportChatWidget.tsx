'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bot, CheckCircle2, ChevronLeft, Headphones, Loader2, MessageCircle, Plus, Send, UserRound, Wifi, WifiOff, X } from 'lucide-react'
import { api } from '@/lib/api'
import { createSupportMessageId, useSupportSocket } from '@/hooks/useSupportSocket'

const openStatuses = ['AI_ACTIVE', 'WAITING_FOR_AGENT', 'AGENT_ASSIGNED', 'AGENT_ACTIVE', 'RESOLVED']
const suggestions = ['How can I add a user?', 'How do I configure currencies?', 'My PDF logo is missing']

export function SupportChatWidget() {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [agentTyping, setAgentTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async (id?: string) => {
    const list = await api.supportList()
    const rows = list.data || []
    setHistory(rows)
    const selected = id ? rows.find((item: any) => item.id === id) : rows.find((item: any) => openStatuses.includes(item.status))
    if (selected) {
      setConversation(selected)
      const response = await api.supportMessages(selected.id)
      setMessages(response.data || [])
      api.supportRead(selected.id).catch(() => {})
    } else {
      setConversation(null); setMessages([])
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setLoading(true); setError('')
    refresh().catch((e: any) => setError(e.message || 'Unable to load support')).finally(() => setLoading(false))
  }, [open, refresh])

  const onSocketEvent = useCallback((event: any) => {
    if (event.event === 'agent.typing') {
      setAgentTyping(!!event.payload?.typing)
      return
    }
    if (event.event?.startsWith('message.') || event.event?.startsWith('conversation.')) refresh(conversation?.id).catch(() => {})
  }, [conversation?.id, refresh])
  const { connected, sendTyping } = useSupportSocket(conversation?.id || null, onSocketEvent)

  useEffect(() => {
    if (!open || connected) return
    const timer = window.setInterval(() => refresh(conversation?.id).catch(() => {}), 5000)
    return () => window.clearInterval(timer)
  }, [connected, conversation?.id, open, refresh])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, agentTyping])

  async function createConversation() {
    setLoading(true); setError(''); setShowHistory(false)
    try {
      const response = await api.supportCreate({ subject: 'Support request' })
      await refresh(response.data.id)
    } catch (e: any) { setError(e.message || 'Unable to start a conversation') }
    finally { setLoading(false) }
  }

  async function send(content = text) {
    const value = content.trim()
    if (!value || sending) return
    if (!conversation) {
      setSending(true)
      try {
        const response = await api.supportCreate({ subject: value.slice(0, 80), message: value })
        setText(''); await refresh(response.data.id)
      } catch (e: any) { setError(e.message || 'Unable to send message') }
      finally { setSending(false) }
      return
    }
    setSending(true); setText(''); setError('')
    try { await api.supportSend(conversation.id, value, createSupportMessageId()); await refresh(conversation.id) }
    catch (e: any) { setText(value); setError(e.message || 'Unable to send message') }
    finally { setSending(false) }
  }

  async function requestAgent() {
    if (!conversation) return
    setSending(true); setError('')
    try { await api.supportRequestAgent(conversation.id); await refresh(conversation.id) }
    catch (e: any) { setError(e.message || 'Unable to contact an agent') }
    finally { setSending(false) }
  }

  const status = conversation?.status
  const humanMode = status && status !== 'AI_ACTIVE'
  const agentName = [conversation?.assignedAgent?.firstName, conversation?.assignedAgent?.lastName].filter(Boolean).join(' ')

  return <>
    <button type="button" onClick={() => setOpen(true)} className="group fixed bottom-20 right-4 z-50 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl md:bottom-6 md:right-6" aria-label="Open AI and live support" title="AI & Live Support">
      <span className="relative"><Headphones size={19}/><span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-indigo-600"/></span>
    </button>
    {open && <div className="fixed inset-0 z-[70] bg-slate-950/25 sm:bg-transparent" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}>
      <section className="absolute inset-x-0 bottom-0 flex h-[min(720px,92dvh)] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[680px] sm:w-[410px] sm:rounded-3xl">
        <header className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 px-4 pb-4 pt-4 text-white">
          <div className="flex items-center gap-3">
            {showHistory && <button onClick={() => setShowHistory(false)} className="rounded-full p-2 hover:bg-white/15"><ChevronLeft size={18}/></button>}
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15"><Headphones size={21}/></div>
            <div className="min-w-0 flex-1"><h2 className="font-semibold">BizForce Support</h2><p className="flex items-center gap-1.5 text-xs text-indigo-100">{connected ? <><Wifi size={12}/> Real-time connected</> : <><WifiOff size={12}/> Reconnecting…</>}</p></div>
            <button onClick={() => setShowHistory(v => !v)} className="rounded-full p-2 hover:bg-white/15" title="Conversation history"><MessageCircle size={18}/></button>
            <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white/15"><X size={19}/></button>
          </div>
          {!showHistory && conversation && <div className="mt-3 flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-xs"><span>{agentName ? `${agentName} is assisting you` : status === 'AI_ACTIVE' ? 'AI Assistant' : status === 'RESOLVED' ? 'Resolved' : 'Waiting for a support agent'}</span><span className="h-2 w-2 rounded-full bg-emerald-300"/></div>}
        </header>
        {showHistory ? <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Your conversations</h3><button onClick={createConversation} className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950"><Plus size={14}/> New</button></div>
          <div className="space-y-2">{history.map(item => <button key={item.id} onClick={async () => { setShowHistory(false); setLoading(true); await refresh(item.id); setLoading(false) }} className="w-full rounded-xl border p-3 text-left hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30"><div className="flex justify-between gap-2"><span className="truncate text-sm font-medium">{item.subject}</span><span className="text-[10px] text-muted-foreground">{new Date(item.lastMessageAt).toLocaleDateString()}</span></div><p className="mt-1 truncate text-xs text-muted-foreground">{item.messages?.[0]?.content || 'No messages'}</p><span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold dark:bg-slate-800">{item.status.replaceAll('_', ' ')}</span></button>)}</div>
        </div> : <>
          <div className="flex-1 overflow-y-auto bg-slate-50/80 px-4 py-4 dark:bg-slate-950/40">
            {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"/>)}</div> : !conversation ? <div className="flex h-full flex-col items-center justify-center text-center"><div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950"><Bot size={30}/></div><h3 className="text-lg font-semibold">How can we help?</h3><p className="mt-2 max-w-xs text-sm text-muted-foreground">Start with our AI assistant, and reach a human support agent at any time.</p><button onClick={createConversation} className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white">Start conversation</button></div> : <>
              {messages.map(message => {
                const mine = message.senderType === 'CUSTOMER'
                if (message.senderType === 'SYSTEM') return <div key={message.id} className="my-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"><CheckCircle2 size={14}/>{message.content}</div>
                return <div key={message.id} className={`mb-3 flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}><div className={`mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full ${mine ? 'bg-indigo-600 text-white' : message.senderType === 'AI' ? 'bg-violet-100 text-violet-700 dark:bg-violet-950' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950'}`}>{mine ? <UserRound size={14}/> : message.senderType === 'AI' ? <Bot size={14}/> : <Headphones size={14}/>}</div><div className={`max-w-[78%] ${mine ? 'text-right' : ''}`}><div className={`rounded-2xl px-3.5 py-2.5 text-left text-sm leading-relaxed shadow-sm ${mine ? 'rounded-tr-sm bg-indigo-600 text-white' : 'rounded-tl-sm border bg-white dark:bg-slate-900'}`}>{message.content}</div><span className="px-1 text-[10px] text-muted-foreground">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div></div>
              })}
              {agentTyping && <p className="text-xs text-muted-foreground">Support agent is typing…</p>}
              {status === 'AI_ACTIVE' && messages.length <= 3 && <div className="mt-3 flex flex-wrap gap-2">{suggestions.map(item => <button key={item} onClick={() => send(item)} className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-50 dark:bg-slate-900">{item}</button>)}</div>}
              <div ref={bottomRef}/>
            </>}
          </div>
          {conversation && <footer className="border-t bg-white p-3 dark:bg-slate-900">
            {status === 'AI_ACTIVE' && <button onClick={requestAgent} disabled={sending} className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300"><Headphones size={15}/> Talk to a human agent</button>}
            {status === 'CLOSED' ? <button onClick={createConversation} className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white">Start a new conversation</button> : <div className="flex items-end gap-2"><textarea value={text} onChange={e => { setText(e.target.value); sendTyping(true) }} onBlur={() => sendTyping(false)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} rows={1} placeholder={humanMode ? 'Message support…' : 'Ask the AI assistant…'} className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border bg-slate-50 px-3 py-3 text-sm outline-none focus:border-indigo-400 dark:bg-slate-950"/><button onClick={() => send()} disabled={!text.trim() || sending} className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-600 text-white disabled:opacity-50">{sending ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}</button></div>}
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </footer>}
        </>}
      </section>
    </div>}
  </>
}
