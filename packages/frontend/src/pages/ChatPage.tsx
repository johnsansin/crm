import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/auth'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useToast } from '@/lib/toast'
import { t } from '@/lib/i18n'
import { formatTime } from '@/lib/org-format'
import { UserAvatar } from '@/components/UserAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Loader2, Send, Plus, Users, MessageSquare, X, ChevronLeft, LogOut } from 'lucide-react'

const MSG_POLL_MS = 4000
const CONV_POLL_MS = 15000

function conversationTitle(c: any, me: any) {
  if (c.type === 'group') return c.name || t('Group chat')
  const other = c.others?.[0]
  return other ? `${other.firstName || ''} ${other.lastName || ''}`.trim() || other.email : t('Chat')
}

function userFullName(u: any) {
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || '?'
}

export function ChatPage() {
  const { user } = useAuthStore()
  const me = user?.id
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [groupName, setGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const threadRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLInputElement>(null)

  const { data: usersData } = useQuery({
    queryKey: ['chat-users'],
    queryFn: () => api.getChatUsers().catch(() => ({ data: [] })),
  })

  const { data: convosData } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: () => api.getChatConversations().catch(() => ({ data: [] })),
    refetchInterval: CONV_POLL_MS,
  })

  const { data: messagesData, isFetching: messagesLoading } = useQuery({
    queryKey: ['chat-messages', selectedId],
    queryFn: () => (selectedId ? api.getChatMessages(selectedId).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })),
    refetchInterval: selectedId ? MSG_POLL_MS : false,
    enabled: !!selectedId,
  })

  const users = (usersData?.data || []).filter((u: any) => u.id !== me)
  const conversations = (convosData?.data || []) as any[]
  const selected = conversations.find((c: any) => c.id === selectedId) || null
  const messages = (messagesData?.data || []) as any[]
  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  useEffect(() => {
    if (!selectedId) return
    const conv = conversations.find((c: any) => c.id === selectedId)
    if (conv && conv.unreadCount > 0) {
      api.markChatRead(selectedId).catch(() => {})
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] })
    }
  }, [selectedId, conversations, queryClient])

  useEffect(() => {
    if (threadRef.current && messages.length) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [selectedId, messages.length])

  const openConversation = (id: string) => {
    setSelectedId(id)
    const conv = conversations.find((c: any) => c.id === id)
    if (conv && conv.unreadCount > 0) {
      api.markChatRead(id).catch(() => {})
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] })
    }
  }

  const sendMessage = async () => {
    const text = body.trim()
    if (!text || !selectedId || sending) return
    setSending(true)
    try {
      await api.sendChatMessage(selectedId, text)
      setBody('')
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedId] })
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] })
      bodyRef.current?.focus()
    } catch (e: any) {
      addToast({ title: t('Error'), description: e?.message || String(e), variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const startNewChat = async () => {
    const ids = picked.filter(Boolean)
    if (!ids.length) return
    setCreating(true)
    try {
      const data: any = { participantIds: ids }
      if (ids.length > 1) data.name = groupName.trim() || t('Group chat')
      const res = await api.createChatConversation(data)
      setNewChatOpen(false)
      setPicked([])
      setGroupName('')
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] })
      setSelectedId(res.data.id)
    } catch (e: any) {
      addToast({ title: t('Error'), description: e?.message || String(e), variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const addMembers = async (convId: string) => {
    if (!picked.length) return
    setCreating(true)
    try {
      await api.addChatMembers(convId, picked)
      setPicked([])
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] })
      addToast({ title: t('Members added') })
    } catch (e: any) {
      addToast({ title: t('Error'), description: e?.message || String(e), variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const leaveChat = async () => {
    if (!selectedId) return
    try {
      await api.leaveChatConversation(selectedId)
      setSelectedId(null)
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] })
    } catch (e: any) {
      addToast({ title: t('Error'), description: e?.message || String(e), variant: 'destructive' })
    }
  }

  const togglePick = (id: string) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const pickable = selected && selected.type === 'group'
    ? users.filter((u: any) => !selected.participants.some((p: any) => p.userId === u.id))
    : users

  return (
    <div className="h-[calc(100vh-7.5rem)] flex gap-4 min-h-[480px]">
      <aside className={cn(
        'w-full md:w-80 shrink-0 flex flex-col rounded-xl border border-border/70 bg-card overflow-hidden',
        selectedId && 'hidden md:flex',
      )}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-primary" />
            <h2 className="text-sm font-bold">{t('Chat')}</h2>
            {unreadTotal > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadTotal}
              </span>
            )}
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setNewChatOpen(true)}>
            <Plus size={14} /> {t('New chat')}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground p-6">
              <Users size={28} />
              <p className="text-sm text-center">{t('No conversations yet')}</p>
              <Button variant="outline" size="sm" className="mt-1" onClick={() => setNewChatOpen(true)}>
                <Plus size={14} className="mr-1.5" /> {t('Start a chat')}
              </Button>
            </div>
          ) : (
            conversations.map((c: any) => {
              const unread = c.unreadCount || 0
              const other = c.others?.[0]
              const last = c.lastMessage
              return (
                <button
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/60 transition-colors border-b border-border/40',
                    selectedId === c.id && 'bg-accent/80',
                  )}
                >
                  <div className="relative shrink-0">
                    {c.type === 'group' ? (
                      <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                        <Users size={18} />
                      </div>
                    ) : (
                      <UserAvatar user={other} size={40} />
                    )}
                    {other?.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold truncate">{conversationTitle(c, me)}</p>
                      {last && <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(last.createdAt)}</span>}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-xs truncate', unread ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                        {c.type === 'group' && last && <span className="font-semibold">{last.sender.email !== me && userFullName(last.sender)}</span>}
                        {last ? last.body : t('No messages yet')}
                      </p>
                      {unread > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      <section className={cn(
        'flex-1 flex-col rounded-xl border border-border/70 bg-card overflow-hidden',
        selectedId ? 'flex' : 'hidden md:flex',
      )}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground p-6">
            <MessageSquare size={36} className="opacity-50" />
            <p className="text-sm">{t('Select a conversation or start a new one')}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60">
              <button className="md:hidden text-muted-foreground" onClick={() => setSelectedId(null)}>
                <ChevronLeft size={18} />
              </button>
              <div className="relative shrink-0">
                {selected.type === 'group' ? (
                  <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                    <Users size={15} />
                  </div>
                ) : (
                  <UserAvatar user={selected.others?.[0]} size={32} />
                )}
                {selected.others?.[0]?.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">{conversationTitle(selected, me)}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {selected.type === 'group'
                    ? selected.participants.map((p: any) => userFullName(p.user)).join(', ')
                    : (selected.others?.[0]?.online ? t('Online now') : t('Offline'))}
                </p>
              </div>
              {selected.type === 'group' && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-muted-foreground"
                    title={t('Add members')}
                    onClick={() => setNewChatOpen(true)}
                  >
                    <Plus size={14} /> {t('Add')}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title={t('Leave chat')} onClick={leaveChat}>
                    <LogOut size={14} />
                  </Button>
                </div>
              )}
              {selected.type === 'direct' && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title={t('Leave chat')} onClick={leaveChat}>
                  <LogOut size={14} />
                </Button>
              )}
            </div>

            <div ref={threadRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-muted/20">
              {messagesLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">{t('No messages yet. Say hello!')}</p>
              ) : (
                messages.map((m: any) => {
                  const mine = m.senderId === me
                  return (
                    <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-sm break-words',
                        mine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border/60 rounded-bl-sm',
                      )}>
                        {selected.type === 'group' && !mine && (
                          <p className="text-[10px] font-semibold text-primary mb-0.5">{userFullName(m.sender)}</p>
                        )}
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className={cn('text-[10px] mt-0.5 text-right', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                          {formatTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="p-3 border-t border-border/60 flex items-center gap-2">
              <Input
                ref={bodyRef}
                value={body}
                placeholder={t('Type a message...')}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                className="h-10 rounded-full"
              />
              <Button size="icon" className="h-10 w-10 rounded-full shrink-0" onClick={sendMessage} disabled={sending || !body.trim()}>
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </div>
          </>
        )}
      </section>

      <Dialog open={newChatOpen} onOpenChange={(o) => { setNewChatOpen(o); if (!o) { setPicked([]); setGroupName('') } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.type === 'group' ? t('Add members') : t('New chat')}</DialogTitle>
            <DialogDescription>
              {selected?.type === 'group' ? t('Add people to this group chat') : t('Pick one or more people to start chatting')}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {pickable.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">{t('No more members to add')}</p>
            )}
            {pickable.map((u: any) => {
              const checked = picked.includes(u.id)
              return (
                <button
                  key={u.id}
                  onClick={() => togglePick(u.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left',
                    checked && 'bg-accent/70',
                  )}
                >
                  <div className="relative shrink-0">
                    <UserAvatar user={u} size={36} />
                    {u.online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{userFullName(u)}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <span className={cn(
                    'h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                    checked ? 'bg-primary border-primary text-primary-foreground' : 'border-border',
                  )}>
                    {checked && <X size={12} />}
                  </span>
                </button>
              )
            })}
          </div>
          {!selected?.type && picked.length > 1 && (
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={t('Group name (optional)')}
              className="h-9"
            />
          )}
          <div className="flex justify-end pt-1">
            <Button
              onClick={selected?.type === 'group' ? () => addMembers(selected.id) : startNewChat}
              disabled={creating || !picked.length}
              className="gap-1.5"
            >
              {creating && <Loader2 size={14} className="animate-spin" />}
              {selected?.type === 'group' ? t('Add members') : picked.length > 1 ? t('Create group') : t('Start chat')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
