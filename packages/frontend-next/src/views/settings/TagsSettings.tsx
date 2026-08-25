'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Plus, Tag, Trash2, Pencil, Loader2, Save } from 'lucide-react'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

export function TagsSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#4f46e5')
  const [editing, setEditing] = useState<any | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['tags'], queryFn: () => api.getTags() })

  const createMutation = useMutation({
    mutationFn: () => api.createTag({ name: name.trim(), color, isPrivate: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setName('')
      addToast({ title: 'Tag created', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: () => api.updateTag(editing.id, editName.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setEditing(null)
      addToast({ title: 'Tag updated', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteTag(deleteId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setDeleteId(null)
      addToast({ title: 'Tag deleted', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const items = (data?.data || []).filter((t: any) => !t.module || !t.recordId)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Create a Tag</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Tag name (e.g. VIP Customer, Follow-up needed)"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && name.trim()) createMutation.mutate() }}
              className="max-w-sm"
            />
            <label className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-xs font-medium text-muted-foreground">
              Colour <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0" aria-label="Tag colour" />
            </label>
            <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending}>
              {createMutation.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Plus size={14} className="mr-1.5" />}
              Add Tag
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Tags are private to your organisation and can be attached to any record from its detail view.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">All Tags</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading tags…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tags yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {items.map((t: any) => (
                <span key={t.id} style={t.color ? { borderColor: t.color, color: t.color, backgroundColor: `${t.color}12` } : undefined} className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1.5 text-sm">
                  <Tag size={13} />
                  {editing?.id === t.id ? (
                    <Input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') updateMutation.mutate(); if (e.key === 'Escape') setEditing(null) }}
                      className="h-7 w-40 px-2"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium">{t.name}</span>
                  )}
                  {editing?.id === t.id ? (
                    <>
                      <button onClick={() => updateMutation.mutate()} disabled={!editName.trim() || updateMutation.isPending} className="text-emerald-600 hover:text-emerald-700">
                        <Save size={14} />
                      </button>
                      <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
                        <Pencil size={14} />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setEditing(t); setEditName(t.name) }} className="text-muted-foreground hover:text-foreground">
                      <Pencil size={13} />
                    </button>
                  )}
                  <button onClick={() => setDeleteId(t.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Tag"
        description="This tag will be removed from all records. This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  )
}
