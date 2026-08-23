import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tag, X, Plus, Lock, Search, Loader2 } from 'lucide-react'

export function RecordTags({ module, recordId }: { module: string; recordId: string }) {
  const qc = useQueryClient()
  const { addToast } = useToast()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { data, isLoading } = useQuery({ queryKey: ['tags', module, recordId], queryFn: () => api.getTags({ module, recordId }) })
  const all = data?.data || []
  const catalogue = all.filter((tag: any) => !tag.module && !tag.recordId)
  const attached = all.filter((tag: any) => tag.module === module && tag.recordId === recordId)
  const available = useMemo(() => catalogue.filter((tag: any) => !attached.some((item: any) => item.parentTagId === tag.id || item.name.toLowerCase() === tag.name.toLowerCase()) && tag.name.toLowerCase().includes(search.trim().toLowerCase())), [catalogue, attached, search])

  const done = (message: string) => { qc.invalidateQueries({ queryKey: ['tags'] }); setSearch(''); setOpen(false); addToast({ title: message, variant: 'success' }) }
  const failed = (title: string) => (error: Error) => addToast({ title, description: error.message, variant: 'destructive' })
  const attach = useMutation({
    mutationFn: (tag: any) => api.createTag({ name: tag.name, color: tag.color, isPrivate: tag.isPrivate, parentTagId: tag.id, module, recordId }),
    onSuccess: () => done('Tag added'), onError: failed('Could not add tag'),
  })
  const createPrivate = useMutation({
    mutationFn: async () => { const tag = await api.createTag({ name: search.trim(), isPrivate: true }); return api.createTag({ name: tag.name, color: tag.color, isPrivate: true, parentTagId: tag.id, module, recordId }) },
    onSuccess: () => done('Private tag created and added'), onError: failed('Could not create tag'),
  })
  const detach = useMutation({
    mutationFn: (id: string) => api.deleteTag(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); addToast({ title: 'Tag removed', variant: 'success' }) }, onError: failed('Could not remove tag'),
  })
  const exactMatch = catalogue.some((tag: any) => tag.name.toLowerCase() === search.trim().toLowerCase())

  return <Card className="overflow-visible"><CardContent className="flex min-h-16 flex-wrap items-center gap-2 p-3 sm:p-4">
    <div className="mr-1 flex items-center gap-2 text-sm font-semibold"><Tag size={16} className="text-primary" /> Tags</div>
    {isLoading ? <Loader2 size={15} className="animate-spin text-muted-foreground" /> : attached.length === 0 ? <span className="text-xs text-muted-foreground">No tags attached</span> : attached.map((tag: any) => <span key={tag.id} style={tag.color ? { borderColor: tag.color, color: tag.color, backgroundColor: `${tag.color}14` } : undefined} className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{tag.isPrivate && <Lock size={10} aria-label="Private tag" />}{tag.name}<button type="button" disabled={detach.isPending} onClick={() => detach.mutate(tag.id)} className="rounded-full p-0.5 hover:bg-black/10" aria-label={`Remove ${tag.name}`}><X size={11} /></button></span>)}
    <div className="relative sm:ml-auto"><Button type="button" size="sm" variant="outline" onClick={() => setOpen(v => !v)}><Plus size={14} className="mr-1.5" /> Add tag</Button>
      {open && <div className="absolute right-0 top-10 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border bg-popover p-2 text-popover-foreground shadow-xl">
        <div className="relative"><Search size={14} className="absolute left-3 top-3 text-muted-foreground" /><Input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search or create a tag" className="pl-9" /></div>
        <div className="mt-2 max-h-56 overflow-y-auto">{available.map((tag: any) => <button key={tag.id} type="button" disabled={attach.isPending} onClick={() => attach.mutate(tag)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"><span className="h-2.5 w-2.5 rounded-full bg-primary" style={tag.color ? { backgroundColor: tag.color } : undefined} /><span className="flex-1 truncate">{tag.name}</span>{tag.isPrivate && <Lock size={12} className="text-muted-foreground" />}</button>)}
          {search.trim() && !exactMatch && <button type="button" onClick={() => createPrivate.mutate()} disabled={createPrivate.isPending} className="flex w-full items-center gap-2 rounded-lg border-t px-3 py-2.5 text-left text-sm font-medium text-primary hover:bg-accent"><Plus size={14} /> Create private tag “{search.trim()}”</button>}
          {!search.trim() && available.length === 0 && <p className="px-3 py-5 text-center text-xs text-muted-foreground">No more tags available</p>}
          {search.trim() && available.length === 0 && exactMatch && <p className="px-3 py-5 text-center text-xs text-muted-foreground">This tag is already attached</p>}
        </div>
      </div>}
    </div>
  </CardContent></Card>
}
