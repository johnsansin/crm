'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Loader2, Plus, Trash2, Pencil, UserCircle, Paperclip, Link2, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'

const MODULES = ['leads', 'accounts', 'contacts', 'potentials', 'tickets', 'products', 'campaigns', 'vendors', 'projects', 'invoices']

export function AdminDataSettings() {
  const [tab, setTab] = useState<'related' | 'profiles' | 'attachments' | 'schedules'>('related')
  const tabs = [
    { key: 'related' as const, label: 'Related Lists', icon: Link2 },
    { key: 'schedules' as const, label: 'Report Schedules', icon: CalendarClock },
    { key: 'profiles' as const, label: 'User Profiles', icon: UserCircle },
    { key: 'attachments' as const, label: 'Attachments', icon: Paperclip },
  ]
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors',
                tab === t.key ? 'border-primary/40 bg-primary/10 text-primary' : 'bg-background text-muted-foreground hover:bg-muted/50')}>
              <Icon size={15} />{t.label}
            </button>
          )
        })}
      </div>
      {tab === 'related' && <RelatedLists />}
      {tab === 'schedules' && <ReportSchedules />}
      {tab === 'profiles' && <UserProfiles />}
      {tab === 'attachments' && <Attachments />}
    </div>
  )
}

function RelatedLists() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ moduleName: 'accounts', relatedModule: 'contacts', label: '', isActive: true })

  const { data, isLoading } = useQuery({ queryKey: ['related-lists'], queryFn: () => api.getRelatedLists() })
  const items = data?.data || []

  const create = useMutation({
    mutationFn: () => api.createRelatedList({ ...form, sequence: 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['related-lists'] })
      addToast({ title: 'Related list created', variant: 'success' })
      setShowForm(false)
      setForm({ moduleName: 'accounts', relatedModule: 'contacts', label: '', isActive: true })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const remove = useMutation({
    mutationFn: () => api.deleteRelatedList(deleteId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['related-lists'] })
      addToast({ title: 'Related list deleted', variant: 'success' })
      setDeleteId(null)
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Configure which record types appear as related lists on detail pages.</p>
        <Button onClick={() => setShowForm(true)}><Plus size={15} className="mr-1.5" />Add related list</Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-background p-10 text-sm text-muted-foreground"><Loader2 size={16} className="mr-2 animate-spin" />Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-background px-6 py-10 text-center text-sm text-muted-foreground">No related lists configured yet.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          {items.map((r, i) => (
            <div key={r.id} className={cn('flex items-center justify-between gap-3 px-5 py-3', i > 0 && 'border-t')}>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.moduleName} → {r.relatedModule}{!r.isActive && <span className="ml-2 text-slate-400">(inactive)</span>}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)}><Trash2 size={14} /></Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add related list</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Module</label>
              <select value={form.moduleName} onChange={e => setForm({ ...form, moduleName: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none capitalize">
                {MODULES.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Related module</label>
              <select value={form.relatedModule} onChange={e => setForm({ ...form, relatedModule: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none capitalize">
                {MODULES.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Label</label>
              <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Contacts" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4" />
              Active
            </label>
            <div className="flex justify-end gap-2 border-t pt-3">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => create.mutate()} disabled={create.isPending || !form.label.trim()}>
                {create.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o: boolean) => !o && setDeleteId(null)} title="Delete related list?" description="This related list configuration will be removed." confirmLabel="Delete" onConfirm={() => remove.mutate()} />
    </>
  )
}

function ReportSchedules() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ reportName: '', moduleName: 'potentials', reportType: 'tabular', frequency: 'weekly', recipients: '', isActive: true })

  const { data, isLoading } = useQuery({ queryKey: ['report-schedules'], queryFn: () => api.getReportSchedules() })
  const items = data?.data || []

  const resetForm = () => setForm({ reportName: '', moduleName: 'potentials', reportType: 'tabular', frequency: 'weekly', recipients: '', isActive: true })
  const openEdit = (s: any) => {
    setEditId(s.id)
    setForm({
      reportName: s.reportName || '', moduleName: s.moduleName || 'potentials', reportType: s.reportType || 'tabular',
      frequency: s.frequency || 'weekly', recipients: Array.isArray(s.recipients) ? s.recipients.join(', ') : '', isActive: !!s.isActive,
    })
    setShowForm(true)
  }

  const save = useMutation({
    mutationFn: () => {
      if (!form.reportName.trim()) return Promise.reject(new Error('Report name is required'))
      const recipients = form.recipients.split(',').map((r: string) => r.trim()).filter(Boolean)
      return editId ? api.updateReportSchedule(editId, { ...form, recipients }) : api.createReportSchedule({ ...form, recipients })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] })
      addToast({ title: editId ? 'Schedule updated' : 'Schedule created', variant: 'success' })
      setShowForm(false); resetForm()
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const toggle = useMutation({
    mutationFn: (s: any) => api.updateReportSchedule(s.id, { isActive: !s.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['report-schedules'] }),
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const remove = useMutation({
    mutationFn: () => api.deleteReportSchedule(deleteId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] })
      addToast({ title: 'Schedule deleted', variant: 'success' })
      setDeleteId(null)
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Schedule report deliveries to email recipients. (Delivery jobs run on the server.)</p>
        <Button onClick={() => { resetForm(); setShowForm(true) }}><Plus size={15} className="mr-1.5" />New schedule</Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-background p-10 text-sm text-muted-foreground"><Loader2 size={16} className="mr-2 animate-spin" />Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-background px-6 py-10 text-center text-sm text-muted-foreground">No report schedules yet.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          {items.map((s, i) => (
            <div key={s.id} className={cn('flex items-center justify-between gap-3 px-5 py-3', i > 0 && 'border-t')}>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {s.reportName}
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', s.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50' : 'bg-slate-100 text-slate-500')}>{s.isActive ? 'Active' : 'Paused'}</span>
                </p>
                <p className="text-xs text-muted-foreground">{s.frequency} · {s.reportType} · {(Array.isArray(s.recipients) ? s.recipients.length : 0)} recipient(s)</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={() => toggle.mutate(s)}>{s.isActive ? 'Pause' : 'Resume'}</Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil size={14} /></Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit schedule' : 'New report schedule'}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Report name</label>
              <Input value={form.reportName} onChange={e => setForm({ ...form, reportName: e.target.value })} placeholder="Weekly pipeline summary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Module</label>
                <select value={form.moduleName} onChange={e => setForm({ ...form, moduleName: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none capitalize">
                  {MODULES.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                <select value={form.reportType} onChange={e => setForm({ ...form, reportType: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none capitalize">
                  <option value="tabular">Tabular</option><option value="summary">Summary</option><option value="chart">Chart</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Frequency</label>
                <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none">
                  <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Recipients (comma separated emails)</label>
                <Input value={form.recipients} onChange={e => setForm({ ...form, recipients: e.target.value })} placeholder="team@example.com, manager@example.com" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4" />
              Active
            </label>
            <div className="flex justify-end gap-2 border-t pt-3">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}{editId ? 'Save changes' : 'Create schedule'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o: boolean) => !o && setDeleteId(null)} title="Delete schedule?" description="This report schedule will be removed." confirmLabel="Delete" onConfirm={() => remove.mutate()} />
    </>
  )
}

function UserProfiles() {
  const { data, isLoading } = useQuery({ queryKey: ['user-profiles'], queryFn: () => api.getUserProfiles() })
  const items = data?.data || []
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Extended profile settings per user, including super admin flags and permission overrides.</p>
      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-background p-10 text-sm text-muted-foreground"><Loader2 size={16} className="mr-2 animate-spin" />Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-background px-6 py-10 text-center text-sm text-muted-foreground">No user profiles exist yet.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          {items.map((p, i) => {
            const perms = typeof p.permissions === 'object' && p.permissions ? Object.keys(p.permissions) : []
            return (
              <div key={p.id} className={cn('flex items-center justify-between gap-3 px-5 py-3', i > 0 && 'border-t')}>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">{p.user?.name || 'Unknown user'}</p>
                  <p className="text-xs text-muted-foreground">{p.user?.email}{!p.user?.isActive && <span className="ml-2 text-slate-400">(inactive)</span>}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  {p.isSuperAdmin && <span className="rounded-full bg-violet-100 px-2 py-0.5 font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">Super Admin</span>}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800">{perms.length} permission overrides</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Attachments() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { data, isLoading } = useQuery({ queryKey: ['attachments'], queryFn: () => api.getAttachments() })
  const items = data?.data || []

  const remove = useMutation({
    mutationFn: () => api.deleteAttachment(deleteId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] })
      addToast({ title: 'Attachment deleted', variant: 'success' })
      setDeleteId(null)
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Files attached to records across your organization. Deleting removes the database entry and file.</p>
      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-background p-10 text-sm text-muted-foreground"><Loader2 size={16} className="mr-2 animate-spin" />Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-background px-6 py-10 text-center text-sm text-muted-foreground">No attachments uploaded yet.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          {items.map((a, i) => (
            <div key={a.id} className={cn('flex items-center justify-between gap-3 px-5 py-3', i > 0 && 'border-t')}>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{a.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {a.fileSize ? `${(a.fileSize / 1024).toFixed(1)} KB` : ''} · {a.moduleName || '—'} · {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(a.id)}><Trash2 size={14} /></Button>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o: boolean) => !o && setDeleteId(null)} title="Delete attachment?" description="This file will be permanently removed from all records." confirmLabel="Delete" onConfirm={() => remove.mutate()} />
    </div>
  )
}