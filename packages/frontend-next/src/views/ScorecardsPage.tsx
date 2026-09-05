'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Plus, Trash2, Pencil, Loader2, Target, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const MODULES = ['leads', 'potentials', 'accounts', 'contacts', 'tickets', 'products', 'projects', 'campaigns', 'invoices']
const PERIODS = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']
const STATUSES = ['On Track', 'At Risk', 'Off Track', 'Completed']

const statusStyle: Record<string, string> = {
  'On Track': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  'At Risk': 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  'Off Track': 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
}

export function ScorecardsPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({
    name: '', moduleName: 'potentials', period: 'Monthly',
    metrics: '', target: '', actual: '', status: 'On Track',
  })

  const { data, isLoading } = useQuery({ queryKey: ['scorecards'], queryFn: () => api.getScorecards() })
  const items = data?.data || []

  const resetForm = () => {
    setForm({ name: '', moduleName: 'potentials', period: 'Monthly', metrics: '', target: '', actual: '', status: 'On Track' })
    setEditId(null)
  }
  const openCreate = () => { resetForm(); setShowForm(true) }
  const openEdit = (v: any) => {
    setEditId(v.id)
    setForm({
      name: v.name || '', moduleName: v.moduleName || 'potentials', period: v.period || 'Monthly',
      metrics: JSON.stringify(Array.isArray(v.metrics) ? v.metrics : [], null, 2),
      target: v.target != null ? String(v.target) : '',
      actual: v.actual != null ? String(v.actual) : '',
      status: v.status || 'On Track',
    })
    setShowForm(true)
  }

  const isJson = (s: string) => {
    if (!s.trim()) return true
    try { JSON.parse(s); return true } catch { return false }
  }

  const save = useMutation({
    mutationFn: () => {
      if (!form.name.trim()) return Promise.reject(new Error('Scorecard name is required'))
      if (!isJson(form.metrics)) return Promise.reject(new Error('Metrics must be valid JSON'))
      const payload = {
        name: form.name.trim(),
        moduleName: form.moduleName,
        period: form.period,
        status: form.status,
        metrics: form.metrics.trim() ? JSON.parse(form.metrics) : [],
        target: form.target === '' ? null : Number(form.target),
        actual: form.actual === '' ? null : Number(form.actual),
      }
      return editId ? api.updateScorecard(editId, payload) : api.createScorecard(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorecards'] })
      addToast({ title: editId ? 'Scorecard updated' : 'Scorecard created', variant: 'success' })
      setShowForm(false)
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const remove = useMutation({
    mutationFn: () => api.deleteScorecard(deleteId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorecards'] })
      addToast({ title: 'Scorecard deleted', variant: 'success' })
      setDeleteId(null)
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground sm:text-2xl">Scorecards</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track team performance against monthly, quarterly and yearly targets.</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} className="mr-1.5" />New scorecard</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-background p-16 text-sm text-muted-foreground"><Loader2 size={18} className="mr-2 animate-spin" />Loading...</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-background px-6 py-16 text-center">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"><Target size={22} /></span>
          <p className="text-base font-medium text-foreground">No scorecards yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Create a scorecard to set targets and track performance per module.</p>
          <Button className="mt-5" onClick={openCreate}><Plus size={16} className="mr-1.5" />Create scorecard</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(s => {
              const rawPct = s.target != null ? (Number(s.target) ? (Number(s.actual || 0) / Number(s.target)) * 100 : 0) : null
              const pct = rawPct == null ? null : Math.round(rawPct)
              const metrics = Array.isArray(s.metrics) ? s.metrics : []
              return (
                <div key={s.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-foreground">{s.name}</h3>
                      <p className="mt-0.5 text-xs capitalize text-muted-foreground">{s.moduleName} · {s.period}</p>
                    </div>
                    <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium', statusStyle[s.status] || 'bg-slate-100 text-slate-600')}>{s.status}</span>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Target</p>
                      <p className="text-lg font-bold text-foreground">{s.target != null ? Number(s.target).toLocaleString() : '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Actual</p>
                      <p className="text-lg font-bold text-foreground">{s.actual != null ? Number(s.actual).toLocaleString() : '—'}</p>
                    </div>
                    {pct != null && (
                      <div className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold" >
                        {pct >= 100 ? <CheckCircle2 size={13} className="text-emerald-500" /> : pct >= 80 ? <TrendingUp size={13} className="text-blue-500" /> : <TrendingDown size={13} className="text-amber-500" />}
                        {pct}%
                      </div>
                    )}
                  </div>

                  {s.target != null && (
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={cn('h-full rounded-full', (pct ?? 0) >= 100 ? 'bg-emerald-500' : (pct ?? 0) >= 80 ? 'bg-blue-500' : 'bg-amber-500')} style={{ width: `${Math.min(100, pct ?? 0)}%` }} />
                    </div>
                  )}

                  {metrics.length > 0 && (
                    <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                      {metrics.slice(0, 3).map((m: any, i: number) => (
                        <li key={i} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
                          <span className="truncate">{m?.label || m?.name || 'Metric'}</span>
                          <span className="shrink-0 font-medium text-foreground">{m?.value != null ? String(m.value) : '—'}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4 flex items-center justify-end gap-1.5 border-t pt-3">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil size={14} className="mr-1.5" />Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 size={14} className="mr-1.5" />Delete</Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit scorecard' : 'New scorecard'}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Q3 Sales Targets" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Module</label>
                <select value={form.moduleName} onChange={e => setForm({ ...form, moduleName: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none">
                  {MODULES.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Period</label>
                <select value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none">
                  {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Target</label>
                <Input type="number" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} placeholder="e.g. 100000" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Actual</label>
                <Input type="number" value={form.actual} onChange={e => setForm({ ...form, actual: e.target.value })} placeholder="e.g. 82000" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Metrics (JSON array)</label>
              <textarea
                value={form.metrics}
                onChange={e => setForm({ ...form, metrics: e.target.value })}
                rows={3}
                placeholder='[{"label":"Deals closed","value":24},{"label":"Revenue","value":82000}]'
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Each entry: {"{ label: string, value: number }"}</p>
            </div>
            <div className="flex justify-end gap-2 border-t pt-3">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
                {editId ? 'Save changes' : 'Create scorecard'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o: boolean) => !o && setDeleteId(null)}
        title="Delete scorecard?"
        description="This scorecard will be permanently removed."
        confirmLabel="Delete"
        onConfirm={() => remove.mutate()}
      />
    </div>
  )
}