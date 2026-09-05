'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Plus, Trash2, Pencil, Loader2, Eye, EyeOff, Save, ListFilter } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CustomViewsSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [moduleName, setModuleName] = useState('leads')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ name: '', columns: '', conditions: '', orderBy: '', isPublic: false, isDefault: false })

  const { data, isLoading } = useQuery({
    queryKey: ['customviews', moduleName],
    queryFn: () => api.getCustomViews(moduleName),
  })
  const views = data?.data || []

  const resetForm = () => {
    setForm({ name: '', columns: '', conditions: '', orderBy: '', isPublic: false, isDefault: false })
    setEditId(null)
  }

  const openCreate = () => { resetForm(); setShowForm(true) }
  const openEdit = (v: any) => {
    setEditId(v.id)
    setForm({
      name: v.name,
      columns: JSON.stringify(Array.isArray(v.columns) ? v.columns : [], null, 2),
      conditions: JSON.stringify(Array.isArray(v.conditions) ? v.conditions : [], null, 2),
      orderBy: v.orderBy ? JSON.stringify(v.orderBy, null, 2) : '',
      isPublic: !!v.isPublic,
      isDefault: !!v.isDefault,
    })
    setShowForm(true)
  }

  const isJson = (s: string) => {
    if (!s.trim()) return true
    try { JSON.parse(s); return true } catch { return false }
  }

  const save = useMutation({
    mutationFn: () => {
      if (!form.name.trim()) return Promise.reject(new Error('View name is required'))
      if (!isJson(form.columns) || !isJson(form.conditions) || (form.orderBy && !isJson(form.orderBy))) {
        return Promise.reject(new Error('Columns, conditions and order by must be valid JSON'))
      }
      const payload = {
        name: form.name.trim(),
        columns: form.columns.trim() ? JSON.parse(form.columns) : [],
        conditions: form.conditions.trim() ? JSON.parse(form.conditions) : [],
        orderBy: form.orderBy.trim() ? JSON.parse(form.orderBy) : null,
        isPublic: form.isPublic,
        isDefault: form.isDefault,
      }
      return editId ? api.updateCustomView(editId, payload) : api.createCustomView(moduleName, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customviews', moduleName] })
      setShowForm(false)
      resetForm()
      addToast({ title: 'Saved view ' + (editId ? 'updated' : 'created'), variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteCustomView(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customviews', moduleName] })
      setDeleteId(null)
      addToast({ title: 'View deleted', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const moduleOptions = ['leads', 'accounts', 'contacts', 'potentials', 'tickets', 'products', 'projects', 'campaigns', 'invoices']

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Saved views</h3>
          <p className="text-xs text-muted-foreground">
            Create saved filters and column layouts per module. Apply a view to quickly reproduce a filtered list without rebuilding it each time.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus size={14} className="mr-1.5" />New view</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Module:</span>
        {moduleOptions.map(m => (
          <button
            key={m}
            onClick={() => setModuleName(m)}
            className={cn('rounded-full px-3 py-1 text-xs font-semibold transition-colors',
              moduleName === m ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70')}
          >
            {m}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-10 text-sm text-muted-foreground"><Loader2 size={16} className="mr-2 animate-spin" />Loading views...</div>
      ) : views.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed bg-slate-50/50 dark:bg-slate-900/30 p-12 text-center">
          <ListFilter size={32} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-medium">No saved views for {moduleName} yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create your first saved view to reuse filters and columns.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">Name</th>
                <th className="px-4 py-2.5 text-left">Columns</th>
                <th className="px-4 py-2.5 text-left">Conditions</th>
                <th className="px-4 py-2.5 text-left">Visibility</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {views.map((v: any) => (
                <tr key={v.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{v.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{Array.isArray(v.columns) ? v.columns.length : 0} cols</td>
                  <td className="px-4 py-3 text-muted-foreground">{Array.isArray(v.conditions) ? v.conditions.length : 0} rules</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      v.isPublic ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300')}>
                      {v.isPublic ? <Eye size={11} /> : <EyeOff size={11} />} {v.isPublic ? 'Public' : 'Private'}
                      {v.isDefault && ' · Default'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(v)} className="grid h-7 w-7 place-items-center rounded-md border bg-background text-muted-foreground hover:text-indigo-600" title="Edit"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteId(v.id)} className="grid h-7 w-7 place-items-center rounded-md border bg-background text-muted-foreground hover:text-red-600" title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit saved view' : 'New saved view'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">View name *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Hot leads this month" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Columns (JSON array)</label>
              <textarea
                value={form.columns}
                onChange={e => setForm({ ...form, columns: e.target.value })}
                rows={3}
                placeholder='["firstName","company","leadStatus"]'
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Conditions (JSON array)</label>
              <textarea
                value={form.conditions}
                onChange={e => setForm({ ...form, conditions: e.target.value })}
                rows={3}
                placeholder='[{"field":"leadStatus","op":"eq","value":"Qualified"}]'
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Order by (JSON, optional)</label>
              <textarea
                value={form.orderBy}
                onChange={e => setForm({ ...form, orderBy: e.target.value })}
                rows={2}
                placeholder='{"field":"updatedAt","dir":"desc"}'
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} className="h-4 w-4" />
                Public (shared with team)
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="h-4 w-4" />
                Set as default
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o: boolean) => !o && setDeleteId(null)}
        title="Delete saved view"
        description="This saved view will be permanently removed. Records are not affected."
        confirmLabel="Delete"
        onConfirm={() => deleteId && remove.mutate(deleteId)}
      />
    </div>
  )
}
