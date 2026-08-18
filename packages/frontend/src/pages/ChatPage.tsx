import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/auth'
import { api } from '@/lib/api'
import { publicUrl } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useToast } from '@/lib/toast'
import { t } from '@/lib/i18n'
import { formatTime } from '@/lib/org-format'
import { UserAvatar } from '@/components/UserAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Loader2, Send, Plus, Users, MessageSquare, X, ChevronLeft, LogOut,
  Paperclip, FileText, Image, Film, Music, Download, File
} from 'lucide-react'

const MSG_POLL_MS = 4000
const CONV_POLL_MS = 15000
const MAX_FILE_SIZE = 25 * 1024 * 1024

function conversationTitle(c: any, me: any) {
  if (c.type === 'group') return c.name || t('Group chat')
  const other = c.others?.[0]
  return other ? `${other.firstName || ''} ${other.lastName || ''}`.trim() || other.email : t('Chat')
}

function userFullName(u: any) {
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || '?'
}

function fileIcon(mime: string) {
  if (!mime) return File
  if (mime.startsWith('image/')) return Image
  if (mime.startsWith('video/')) return Film
  if (mime.startsWith('audio/')) return Music
  if (mime.includes('pdf') || mime.includes('document') || mime.includes('text')) return FileText
  return File
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function AttachmentBubble({ att, mine }: { att: any; mine: boolean }) {
  const Icon = fileIcon(att.fileType)
  const isImage = att.fileType?.startsWith('image/')
  const url = publicUrl(att.filePath)

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1 mb-0.5">
        <img src={url} alt={att.fileName} className="max-w-[240px] max-h-[180px] rounded-lg object-cover shadow-sm" />
        <p className={cn('text-[10px] mt-0.5 truncate', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{att.fileName}</p>
      </a>
    )
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-xl mt-1 mb-0.5 border transition-colors',
        mine
          ? 'bg-white/15 border-white/20 hover:bg-white/25'
          : 'bg-muted/50 border-border/60 hover:bg-muted',
      )}
    >
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
        mine ? 'bg-white/20' : 'bg-primary/10',
      )}>
        <Icon size={16} className={mine ? 'text-white' : 'text-primary'} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-xs font-medium truncate', mine ? 'text-white' : 'text-foreground')}>{att.fileName}</p>
        <p className={cn('text-[10px]', mine ? 'text-white/60' : 'text-muted-foreground')}>{formatFileSize(att.fileSize)}</p>
      </div>
      <Download size={14} className={cn('shrink-0', mine ? 'text-white/60' : 'text-muted-foreground')} />
    </a>
  )
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
  const [files, setFiles] = useState<File[]>([])
  const threadRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    setFiles([])
    const conv = conversations.find((c: any) => c.id === id)
    if (conv && conv.unreadCount > 0) {
      api.markChatRead(id).catch(() => {})
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    const valid = selected.filter(f => f.size <= MAX_FILE_SIZE)
    if (valid.length < selected.length) {
      addToast({ title: t('File too large'), description: t('Max file size is 25MB'), variant: 'destructive' })
    }
    setFiles(prev => [...prev, ...valid].slice(0, 10))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const sendMessage = async () => {
    const text = body.trim()
    if ((!text && files.length === 0) || !selectedId || sending) return
    setSending(true)
    try {
      await api.sendChatMessage(selectedId, text, files.length > 0 ? files : undefined)
      setBody('')
      setFiles([])
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
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p.id !== id) : [...prev, id]))
  }

  const pickable = selected && selected.type === 'group'
    ? users.filter((u: any) => !selected.participants.some((p: any) => p.userId === u.id))
    : users

  const canSend = body.trim() || files.length > 0

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
              const hasAttach = last?.attachments && last.attachments.length > 0
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
                        {hasAttach && !last.body && <><Paperclip size={10} className="inline mr-0.5" />{last.attachments.length} file{last.attachments.length > 1 ? 's' : ''}</>}
                        {hasAttach && last.body && <>{last.body}</>}
                        {!hasAttach && <>{last ? last.body : t('No messages yet')}</>}
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
                  <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground" title={t('Add members')} onClick={() => setNewChatOpen(true)}>
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
                  const attachments = m.attachments || []
                  return (
                    <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-sm break-words',
                        mine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border/60 rounded-bl-sm',
                      )}>
                        {selected.type === 'group' && !mine && (
                          <p className="text-[10px] font-semibold text-primary mb-0.5">{userFullName(m.sender)}</p>
                        )}
                        {attachments.length > 0 && (
                          <div className="space-y-1">
                            {attachments.map((att: any, i: number) => (
                              <AttachmentBubble key={i} att={att} mine={mine} />
                            ))}
                          </div>
                        )}
                        {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                        <p className={cn('text-[10px] mt-0.5 text-right', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                          {formatTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {files.length > 0 && (
              <div className="px-3 py-2 border-t border-border/40 flex flex-wrap gap-2 bg-muted/10">
                {files.map((f, i) => {
                  const Icon = fileIcon(f.type)
                  return (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted border border-border/60 text-xs">
                      <Icon size={14} className="text-primary shrink-0" />
                      <span className="truncate max-w-[120px]">{f.name}</span>
                      <span className="text-muted-foreground">{formatFileSize(f.size)}</span>
                      <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition-colors"><X size={12} /></button>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="p-3 border-t border-border/60 flex items-center gap-2">
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar" />
              <Button
                variant="ghost" size="icon"
                className="h-10 w-10 rounded-full shrink-0 text-muted-foreground hover:text-primary"
                title={t('Attach files')}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={18} />
              </Button>
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
              <Button size="icon" className="h-10 w-10 rounded-full shrink-0" onClick={sendMessage} disabled={sending || !canSend}>
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
            <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder={t('Group name (optional)')} className="h-9" />
          )}
          <div className="flex justify-end pt-1">
            <Button onClick={selected?.type === 'group' ? () => addMembers(selected.id) : startNewChat} disabled={creating || !picked.length} className="gap-1.5">
              {creating && <Loader2 size={14} className="animate-spin" />}
              {selected?.type === 'group' ? t('Add members') : picked.length > 1 ? t('Create group') : t('Start chat')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
