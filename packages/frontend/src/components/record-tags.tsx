import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tag, X } from 'lucide-react'

export function RecordTags({ module, recordId }: { module: string; recordId: string }) {
  const qc = useQueryClient(); const [selected, setSelected] = useState('')
  const { data } = useQuery({ queryKey: ['tags', module, recordId], queryFn: () => api.getTags() })
  const all = data?.data || []; const catalogue = all.filter((tag:any) => !tag.module && !tag.recordId)
  const attached = all.filter((tag:any) => tag.module === module && tag.recordId === recordId)
  const attach = useMutation({ mutationFn: () => api.createTag({ name: selected, module, recordId }), onSuccess: () => { setSelected(''); qc.invalidateQueries({ queryKey: ['tags'] }) } })
  const detach = useMutation({ mutationFn: (id:string) => api.deleteTag(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }) })
  const available = catalogue.filter((tag:any) => !attached.some((item:any) => item.name === tag.name))
  return <Card><CardContent className="flex flex-wrap items-center gap-2 p-4"><div className="mr-2 flex items-center gap-2 text-sm font-semibold"><Tag size={16} className="text-primary" />Tags</div>{attached.map((tag:any) => <span key={tag.id} className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{tag.name}<button type="button" onClick={() => detach.mutate(tag.id)} aria-label={`Remove ${tag.name}`}><X size={12} /></button></span>)}<div className="ml-auto flex min-w-[240px] gap-2"><Select value={selected} onValueChange={setSelected}><SelectTrigger className="h-9"><SelectValue placeholder="Add organization tag" /></SelectTrigger><SelectContent>{available.map((tag:any) => <SelectItem key={tag.id} value={tag.name}>{tag.name}</SelectItem>)}</SelectContent></Select><Button type="button" size="sm" disabled={!selected || attach.isPending} onClick={() => attach.mutate()}>Attach</Button></div></CardContent></Card>
}
