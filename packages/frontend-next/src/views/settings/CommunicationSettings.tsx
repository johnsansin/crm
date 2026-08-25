'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateField, DateTimeField } from '@/components/ui/date-field'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DataTable } from '@/components/ui/data-table'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Megaphone, CalendarDays, Bell, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { formatDate, formatDateTime, useOrgSettings } from '@/lib/org-format'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

function fmtDate(v: any) {
  if (!v) return '—'
  return formatDateTime(v) || '—'
}

export function CommunicationSettings() {
  useOrgSettings()
  const [tab, setTab] = useState('announcements')
  return (
    <div className="space-y-4">
      <TabsRoot value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="announcements" className="gap-2 data-[state=active]:border-pink-500 data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-400"><Megaphone size={15} /> Announcements</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 data-[state=active]:border-pink-500 data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-400"><Bell size={15} /> Notifications</TabsTrigger>
          <TabsTrigger value="holidays" className="gap-2 data-[state=active]:border-pink-500 data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-400"><CalendarDays size={15} /> Holidays</TabsTrigger>
        </TabsList>
        <TabsContent value="announcements"><AnnouncementsTab /></TabsContent>
        <TabsContent value="notifications"><NotificationsTab /></TabsContent>
        <TabsContent value="holidays"><HolidaysTab /></TabsContent>
      </TabsRoot>
    </div>
  )
}

function AnnouncementsTab() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ title: '', message: '', startsAt: '', expiresAt: '', isActive: true })

  const { data, isLoading } = useQuery({ queryKey: ['announcements'], queryFn: () => api.getAnnouncements() })

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createAnnouncement(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['announcements'] }); addToast({ title: 'Announcement created', variant: 'success' }); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const updateMutation = useMutation({
    mutationFn: (d: any) => api.updateAnnouncement(editId!, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['announcements'] }); addToast({ title: 'Announcement updated', variant: 'success' }); setEditId(null); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const deleteMutation = useMutation({
    mutationFn: () => api.deleteAnnouncement(deleteId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['announcements'] }); addToast({ title: 'Announcement deleted', variant: 'success' }); setDeleteId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: any) => api.updateAnnouncement(id, { isActive }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['announcements'] }); addToast({ title: 'Announcement updated', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const submit = () => {
    const d = { title: form.title, message: form.message, startsAt: form.startsAt || undefined, expiresAt: form.expiresAt || undefined, isActive: form.isActive }
    if (editId) updateMutation.mutate(d)
    else createMutation.mutate(d)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Active announcements appear as a banner for every user in the CRM.</p>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ title: '', message: '', startsAt: '', expiresAt: '', isActive: true }); setShowForm(true) }}>
          <Plus size={15} className="mr-1.5" /> New Announcement
        </Button>
      </div>
      <DataTable
        columns={[
          { key: 'title', label: 'Title' },
          { key: 'message', label: 'Message', render: (v) => <span className="block max-w-xs truncate text-muted-foreground">{v || '—'}</span> },
          { key: 'startsAt', label: 'Starts', render: (v) => <span className="text-muted-foreground">{fmtDate(v)}</span> },
          { key: 'expiresAt', label: 'Expires', render: (v) => <span className="text-muted-foreground">{fmtDate(v)}</span> },
          { key: 'isActive', label: 'Active', render: (_, a) => (
            <button onClick={() => toggleMutation.mutate({ id: a.id, isActive: !a.isActive })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${a.isActive ? 'bg-emerald-500' : 'bg-muted'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${a.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          ) },
        ]}
        data={data?.data || []}
        loading={isLoading}
        emptyMessage="No announcements yet."
        pageSize={10}
        actions={(a) => (
          <>
            <Button variant="ghost" size="icon" onClick={() => { setEditId(a.id); setForm({ title: a.title, message: a.message || '', startsAt: a.startsAt ? a.startsAt.slice(0, 16) : '', expiresAt: a.expiresAt ? a.expiresAt.slice(0, 16) : '', isActive: a.isActive }); setShowForm(true) }}><Pencil size={13} /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId(a.id)}><Trash2 size={13} className="text-destructive" /></Button>
          </>
        )}
      />

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setEditId(null); setShowForm(o) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Announcement' : 'New Announcement'}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); submit() }} className="space-y-3">
            <Input placeholder="Title" value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} required />
            <textarea placeholder="Message" className={`${inputCls} h-24`} value={form.message} onChange={e => setForm((f: any) => ({ ...f, message: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium block mb-1.5">Starts at</label>
                <DateTimeField value={form.startsAt} onChange={v => setForm((f: any) => ({ ...f, startsAt: v }))} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Expires at</label>
                <DateTimeField value={form.expiresAt} onChange={v => setForm((f: any) => ({ ...f, expiresAt: v }))} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))} />
              Active
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                {editId ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Announcement"
        description="Are you sure you want to delete this announcement?"
        confirmLabel="Delete"
      />
    </div>
  )
}

function NotificationsTab() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => api.getNotifications() })

  const markAllMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); addToast({ title: 'All notifications marked read', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const readMutation = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Notifications generated by workflows and scheduled tasks.</p>
        <Button size="sm" variant="outline" onClick={() => markAllMutation.mutate()}>Mark all as read</Button>
      </div>
      <DataTable
        columns={[
          { key: 'title', label: 'Title' },
          { key: 'message', label: 'Message', render: (v) => <span className="block max-w-xs truncate text-muted-foreground">{v || '—'}</span> },
          { key: 'createdAt', label: 'Created', render: (v) => <span className="text-muted-foreground">{fmtDate(v)}</span> },
          { key: 'isRead', label: 'Status', render: (v) => (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${v ? 'bg-muted text-muted-foreground' : 'bg-emerald-500/10 text-emerald-600'}`}>
              {v ? 'Read' : 'Unread'}
            </span>
          ) },
        ]}
        data={data?.data || []}
        loading={isLoading}
        emptyMessage="No notifications."
        pageSize={10}
        actions={(n) => (
          !n.isRead && <Button size="sm" variant="outline" onClick={() => readMutation.mutate(n.id)}>Mark read</Button>
        )}
      />
    </div>
  )
}

function HolidaysTab() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ title: '', date: '', description: '' })

  const { data, isLoading } = useQuery({ queryKey: ['holidays'], queryFn: () => api.getHolidays() })

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createHoliday(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['holidays'] }); addToast({ title: 'Holiday added', variant: 'success' }); setShowForm(false); setForm({ title: '', date: '', description: '' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const updateMutation = useMutation({
    mutationFn: (d: any) => api.updateHoliday(editId!, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['holidays'] }); addToast({ title: 'Holiday updated', variant: 'success' }); setEditId(null); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const deleteMutation = useMutation({
    mutationFn: () => api.deleteHoliday(deleteId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['holidays'] }); addToast({ title: 'Holiday deleted', variant: 'success' }); setDeleteId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Organization holidays used by the calendar and SLA tracking.</p>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ title: '', date: '', description: '' }); setShowForm(true) }}>
          <Plus size={15} className="mr-1.5" /> Add Holiday
        </Button>
      </div>
      <DataTable
        columns={[
          { key: 'date', label: 'Date', render: (v) => <span className="whitespace-nowrap">{v ? formatDate(v) : '—'}</span> },
          { key: 'title', label: 'Title' },
          { key: 'description', label: 'Description', render: (v) => <span className="text-muted-foreground">{v || '—'}</span> },
        ]}
        data={data?.data || []}
        loading={isLoading}
        emptyMessage="No holidays yet."
        pageSize={10}
        actions={(h) => (
          <>
            <Button variant="ghost" size="icon" onClick={() => { setEditId(h.id); setForm({ title: h.title, date: h.date ? h.date.slice(0, 10) : '', description: h.description || '' }); setShowForm(true) }}><Pencil size={13} /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId(h.id)}><Trash2 size={13} className="text-destructive" /></Button>
          </>
        )}
      />

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setEditId(null); setShowForm(o) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Holiday' : 'Add Holiday'}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); if (editId) updateMutation.mutate(form); else createMutation.mutate(form) }} className="space-y-3">
            <DateField value={form.date} onChange={v => setForm((f: any) => ({ ...f, date: v }))} required />
            <Input placeholder="Title (e.g. Independence Day)" value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} required />
            <Input placeholder="Description (optional)" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                {editId ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Holiday"
        description="Are you sure you want to delete this holiday?"
        confirmLabel="Delete"
      />
    </div>
  )
}
