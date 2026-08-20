import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Send, UserPlus, X, MessageSquare } from 'lucide-react'

export function ChatAdminPage() {
  const { addToast } = useToast()
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState('')

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['chat-widget-admin-sessions'],
    queryFn: () => api.request<{ data: any[] }>('/chat-widget/admin/sessions'),
    refetchInterval: 10000,
  })

  const { data: messagesData } = useQuery({
    queryKey: ['chat-widget-admin-messages', selectedId],
    queryFn: () => selectedId ? api.request<{ data: any[] }>(`/chat-widget/admin/sessions/${selectedId}/messages`) : Promise.resolve({ data: [] }),
    enabled: !!selectedId,
    refetchInterval: 5000,
  })

  const sessions = (sessionsData?.data || []) as any[]
  const messages = (messagesData?.data || []) as any[]
  const selected = sessions.find((s: any) => s.id === selectedId) || null

  const filtered = filter ? sessions.filter((s: any) => s.status === filter) : sessions

  const sendMessage = async () => {
    if (!selectedId || !body.trim() || sending) return
    setSending(true)
    try {
      await api.request(`/chat-widget/admin/sessions/${selectedId}/messages`, { method: 'POST', body: JSON.stringify({ body: body.trim() }) })
      setBody('')
      qc.invalidateQueries({ queryKey: ['chat-widget-admin-messages', selectedId] })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
    finally { setSending(false) }
  }

  const closeSession = async (id: string) => {
    try {
      await api.request(`/chat-widget/admin/sessions/${id}/close`, { method: 'PUT', body: '{}' })
      qc.invalidateQueries({ queryKey: ['chat-widget-admin-sessions'] })
      addToast({ title: 'Session closed', variant: 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  return (
    <div className="h-[calc(100vh-7.5rem)] flex gap-4 min-h-[480px]">
      <aside className="w-full md:w-80 shrink-0 flex flex-col rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-bold mb-2">{t('Chat Sessions')}</h2>
          <div className="flex gap-1">
            {['', 'active', 'closed'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 text-xs rounded-md transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                {f || t('All')}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 flex justify-center"><Loader2 size={18} className="animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm"><MessageSquare size={28} className="mx-auto opacity-40 mb-2" /><p>{t('No sessions')}</p></div>
          ) : (
            filtered.map((s: any) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`w-full text-left px-4 py-3 border-b hover:bg-accent transition-colors ${selectedId === s.id ? 'bg-accent' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{s.visitorName || s.visitorEmail || 'Visitor'}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{s.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{new Date(s.createdAt).toLocaleString()}</p>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="flex-1 flex flex-col rounded-xl border bg-card overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            <p>{t('Select a session to view')}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-2.5 border-b">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{selected.visitorName || selected.visitorEmail || 'Visitor'}</p>
                <p className="text-[10px] text-muted-foreground">{selected.visitorEmail} {selected.visitorIp ? `· IP: ${selected.visitorIp}` : ''}</p>
              </div>
              {selected.status === 'active' && (
                <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => closeSession(selected.id)}>
                  <X size={13} />{t('Close')}
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-muted/20">
              {messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">{t('No messages')}</p>
              ) : (
                messages.map((m: any) => {
                  const isAgent = m.senderType === 'agent'
                  return (
                    <div key={m.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-sm break-words ${isAgent ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border rounded-bl-sm'}`}>
                        <p className="text-[10px] font-semibold mb-0.5">{isAgent ? t('Agent') : t('Visitor')}</p>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className="text-[10px] mt-0.5 text-right opacity-60">{new Date(m.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            {selected.status === 'active' && (
              <div className="p-3 border-t flex items-center gap-2">
                <Input value={body} onChange={e => setBody(e.target.value)} placeholder={t('Type a reply...')} className="h-10 rounded-full"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} />
                <Button size="icon" className="h-10 w-10 rounded-full shrink-0" onClick={sendMessage} disabled={sending || !body.trim()}>
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
