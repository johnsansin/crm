import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Rss, Plus, RefreshCw, Loader2, Trash2, ExternalLink, Pencil, MailOpen } from 'lucide-react'
import { formatDateTime } from '@/lib/org-format'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

export function RssPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [activeFeed, setActiveFeed] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ name: '', url: '', category: '' })

  const { data: feeds, isLoading } = useQuery({ queryKey: ['rssfeeds'], queryFn: () => api.list('rssfeeds', { limit: '100' }) })
  const selected = activeFeed || feeds?.data?.[0]?.id || null

  const { data: entries, isLoading: loadingEntries } = useQuery({
    queryKey: ['rss-entries', selected],
    queryFn: () => api.getRssEntries(selected),
    enabled: !!selected,
  })

  const saveMutation = useMutation({
    mutationFn: (d: any) => editing ? api.update('rssfeeds', editing.id, d) : api.create('rssfeeds', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rssfeeds'] }); addToast({ title: editing ? 'Feed updated' : 'Feed added', variant: 'success' }); setShowForm(false); setEditing(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete('rssfeeds', deleteId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rssfeeds'] }); addToast({ title: 'Feed removed', variant: 'success' }); setDeleteId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const fetchMutation = useMutation({
    mutationFn: (id: string) => api.fetchRssFeed(id),
    onSuccess: (r: any) => { queryClient.invalidateQueries({ queryKey: ['rss-entries'] }); queryClient.invalidateQueries({ queryKey: ['rssfeeds'] }); addToast({ title: 'Feed fetched', description: `${r.added || 0} new entries`, variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Fetch failed', description: e.message, variant: 'destructive' }),
  })

  const readMutation = useMutation({
    mutationFn: ({ id, isRead }: any) => api.markRssRead(id, isRead),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rss-entries'] }),
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Rss className="text-primary" /> RSS Reader</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Aggregate feeds from news and product sources. Feeds refresh automatically every minute.</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setForm({ name: '', url: '', category: '' }); setShowForm(true) }}><Plus size={15} className="mr-1.5" /> Add Feed</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : (
            (feeds?.data || []).map((f: any) => (
              <div key={f.id} className={`rounded-lg border p-3 cursor-pointer transition-colors ${selected === f.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`} onClick={() => setActiveFeed(f.id)}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold truncate">{f.name}</p>
                  {entries?.unread ? <span className="shrink-0 rounded-full bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">{entries.unread}</span> : null}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{f.url}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{f.lastFetchedAt ? `Updated ${formatDateTime(f.lastFetchedAt)}` : 'Never fetched'}</p>
              </div>
            ))
          )}
          {feeds?.data?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No feeds. Add one to get started.</p>}
        </div>

        <div className="lg:col-span-3">
          {selected && (
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{loadingEntries ? 'Loading…' : `${entries?.data?.length || 0} entries · ${entries?.unread || 0} unread`}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => fetchMutation.mutate(selected)} disabled={fetchMutation.isPending}>
                  {fetchMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Fetch Now
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { const f = feeds?.data?.find((x: any) => x.id === selected); setEditing(f); setForm({ name: f.name, url: f.url, category: f.category || '' }); setShowForm(true) }}><Pencil size={13} /></Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(selected)}><Trash2 size={13} className="text-destructive" /></Button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {loadingEntries ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : (entries?.data || []).map((e: any) => (
              <div key={e.id} className={`rounded-lg border p-3.5 ${e.isRead ? '' : 'border-primary/40 bg-primary/[0.03]'}`}>
                <div className="flex items-start justify-between gap-3">
                  <a href={e.link || '#'} target="_blank" rel="noreferrer" onClick={() => readMutation.mutate({ id: e.id, isRead: true })} className="flex-1 min-w-0">
                    <p className={`text-sm ${e.isRead ? 'text-muted-foreground' : 'font-semibold'} truncate flex items-center gap-1.5`}>
                      {e.title} <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
                    </p>
                  </a>
                  <button onClick={() => readMutation.mutate({ id: e.id, isRead: !e.isRead })} className="shrink-0 text-muted-foreground hover:text-primary" title={e.isRead ? 'Mark unread' : 'Mark read'}>
                    <MailOpen size={14} />
                  </button>
                </div>
                {e.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description.replace(/<[^>]+>/g, '').slice(0, 300)}</p>}
                <p className="text-[11px] text-muted-foreground mt-1.5">{e.author ? `${e.author} · ` : ''}{e.pubDate ? formatDateTime(e.pubDate) : ''}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setEditing(null); setShowForm(o) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Feed' : 'Add Feed'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (!form.name || !form.url) return; saveMutation.mutate(form) }} className="space-y-3">
            <Input placeholder="Feed name" value={form.name} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} required />
            <Input placeholder="Feed URL (e.g. https://example.com/rss.xml)" value={form.url} onChange={(e) => setForm((f: any) => ({ ...f, url: e.target.value }))} required />
            <Input placeholder="Category (optional)" value={form.category} onChange={(e) => setForm((f: any) => ({ ...f, category: e.target.value }))} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}{editing ? 'Update' : 'Add Feed'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={() => deleteMutation.mutate()} title="Remove Feed" description="This will remove the feed and its entries." confirmLabel="Remove" />
    </div>
  )
}
