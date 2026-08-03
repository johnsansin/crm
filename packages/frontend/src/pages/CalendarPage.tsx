import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CalendarDays, ChevronLeft, ChevronRight, Plus, CalendarPlus, Pencil, Trash2, Loader2, Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

const TYPE_COLORS: Record<string, string> = {
  Task: 'bg-blue-500',
  Call: 'bg-emerald-500',
  Meeting: 'bg-purple-500',
  Other: 'bg-slate-500',
}

const TASK_STATUS = ['Planned', 'In Progress', 'Completed', 'Deferred']
const EVENT_STATUS = ['Planned', 'Held', 'Not Held']
const PRIORITIES = ['High', 'Medium', 'Low']

type View = 'month' | 'week' | 'day'

function pad(n: number) { return String(n).padStart(2, '0') }

function toLocalInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function activityDay(a: any): Date {
  return a.startAt ? new Date(a.startAt) : a.dueAt ? new Date(a.dueAt) : new Date(a.createdAt)
}

function timeLabel(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getRange(view: View, anchor: Date): { from: string; to: string } {
  if (view === 'month') {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const start = new Date(first)
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7))
    const end = new Date(start)
    end.setDate(start.getDate() + 41)
    end.setHours(23, 59, 59, 999)
    return { from: start.toISOString(), to: end.toISOString() }
  }
  if (view === 'week') {
    const day = new Date(anchor)
    const start = new Date(day)
    start.setDate(day.getDate() - ((day.getDay() + 6) % 7))
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { from: start.toISOString(), to: end.toISOString() }
  }
  const start = new Date(anchor)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setHours(23, 59, 59, 999)
  return { from: start.toISOString(), to: end.toISOString() }
}

function emptyForm(preset: { type: string; date: Date } | null) {
  if (preset) {
    const base = preset.date
    const nine = new Date(base); nine.setHours(9, 0, 0, 0)
    const ten = new Date(base); ten.setHours(10, 0, 0, 0)
    return preset.type === 'Task'
      ? { subject: '', activityType: 'Task', status: 'Planned', priority: 'Medium', location: '', startAt: '', endAt: '', dueAt: toLocalInput(nine), description: '' }
      : { subject: '', activityType: preset.type, status: 'Planned', priority: 'Medium', location: '', startAt: toLocalInput(nine), endAt: toLocalInput(ten), dueAt: '', description: '' }
  }
  return { subject: '', activityType: 'Task', status: 'Planned', priority: 'Medium', location: '', startAt: '', endAt: '', dueAt: '', description: '' }
}

export function CalendarPage() {
  const [view, setView] = useState<View>('month')
  const [anchor, setAnchor] = useState(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [preset, setPreset] = useState<{ type: string; date: Date } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const range = useMemo(() => getRange(view, anchor), [view, anchor])

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', range.from, range.to],
    queryFn: () => api.getCalendar(range.from, range.to),
  })

  const activities = data?.data || []

  const mutateDelete = useMutation({
    mutationFn: (id: string) => api.deleteCalendarActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['activities-upcoming'] })
      addToast({ title: 'Activity deleted', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const openCreate = (type: string, date?: Date) => {
    setEditing(null)
    setPreset({ type, date: date || new Date() })
    setDialogOpen(true)
  }

  const openEdit = (a: any) => {
    setPreset(null)
    setEditing(a)
    setDialogOpen(true)
  }

  const navigate = (dir: 1 | -1) => {
    const next = new Date(anchor)
    if (view === 'month') next.setMonth(next.getMonth() + dir)
    else if (view === 'week') next.setDate(next.getDate() + 7 * dir)
    else next.setDate(next.getDate() + dir)
    setAnchor(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Events and tasks for your organization</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setAnchor(new Date())}>Today</Button>
          <Button size="sm" variant="outline" onClick={() => navigate(-1)}><ChevronLeft size={15} /></Button>
          <Button size="sm" variant="outline" onClick={() => navigate(1)}><ChevronRight size={15} /></Button>
          <span className="text-sm font-semibold w-40 text-center hidden md:block">{formatAnchor(view, anchor)}</span>
          <div className="flex rounded-md border">
            {(['month', 'week', 'day'] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)} className={cn('px-3 py-1.5 text-xs font-medium capitalize', view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent')}>
                {v}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => openCreate('Meeting')}><CalendarPlus size={15} className="mr-1.5" /> Add Event</Button>
          <Button size="sm" variant="outline" onClick={() => openCreate('Task')}><Plus size={15} className="mr-1.5" /> Add Task</Button>
        </div>
      </div>

      <div className="text-sm font-semibold md:hidden">{formatAnchor(view, anchor)}</div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin mr-2" /> Loading...
          </div>
        ) : view === 'month' ? (
          <MonthView activities={activities} anchor={anchor} onCreate={openCreate} onEdit={openEdit} />
        ) : view === 'week' ? (
          <WeekView activities={activities} anchor={anchor} onCreate={openCreate} onEdit={openEdit} />
        ) : (
          <DayView activities={activities} anchor={anchor} onCreate={openCreate} onEdit={openEdit} />
        )}
      </div>

      <ActivityDialog
        open={dialogOpen}
        onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditing(null); setPreset(null) } }}
        editing={editing}
        preset={preset}
        onDelete={(id) => { setDialogOpen(false); setDeleteId(id) }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) mutateDelete.mutate(deleteId); setDeleteId(null) }}
        title="Delete Activity"
        description="Are you sure you want to delete this activity?"
        confirmLabel="Delete"
      />
    </div>
  )
}

function formatAnchor(view: View, anchor: Date) {
  if (view === 'month') return anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  if (view === 'week') {
    const start = new Date(anchor); start.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7))
    const end = new Date(start); end.setDate(start.getDate() + 6)
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
  return anchor.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function ActivityChip({ a, onClick }: { a: any; onClick: () => void }) {
  const color = TYPE_COLORS[a.activityType] || TYPE_COLORS.Other
  const done = a.activityType === 'Task' && a.status === 'Completed'
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={cn('w-full text-left text-xs px-1.5 py-0.5 rounded text-white truncate', color, done && 'opacity-50 line-through')}
      title={a.subject}
    >
      {a.startAt ? timeLabel(new Date(a.startAt)) + ' ' : a.dueAt ? timeLabel(new Date(a.dueAt)) + ' ' : ''}
      {a.subject}
    </button>
  )
}

function MonthView({ activities, anchor, onCreate, onEdit }: { activities: any[]; anchor: Date; onCreate: (type: string, date: Date) => void; onEdit: (a: any) => void }) {
  const days = useMemo(() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const start = new Date(first)
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7))
    const out: Date[] = []
    for (let i = 0; i < 42; i++) { out.push(new Date(start)); start.setDate(start.getDate() + 1) }
    return out
  }, [anchor])
  const today = new Date()

  return (
    <div>
      <div className="grid grid-cols-7 border-b">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayActs = activities.filter(a => sameDay(activityDay(a), day)).sort((a, b) => activityDay(a).getTime() - activityDay(b).getTime())
          const inMonth = day.getMonth() === anchor.getMonth()
          const isToday = sameDay(day, today)
          return (
            <button
              key={i}
              onClick={() => onCreate('Meeting', day)}
              className={cn(
                'min-h-24 md:min-h-28 text-left align-top p-1.5 border-b border-r last:border-r-0 hover:bg-accent/40 transition-colors flex flex-col gap-1',
                !inMonth && 'bg-muted/30'
              )}
            >
              <span className={cn('text-xs font-medium inline-flex items-center justify-center h-6 w-6 rounded-full', isToday ? 'bg-primary text-primary-foreground' : '')}>
                {day.getDate()}
              </span>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {dayActs.slice(0, 3).map(a => <ActivityChip key={a.id} a={a} onClick={() => onEdit(a)} />)}
                {dayActs.length > 3 && <span className="text-[10px] text-muted-foreground px-1">+{dayActs.length - 3} more</span>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ activities, anchor, onCreate, onEdit }: { activities: any[]; anchor: Date; onCreate: (type: string, date: Date) => void; onEdit: (a: any) => void }) {
  const days = useMemo(() => {
    const start = new Date(anchor)
    start.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7))
    const out: Date[] = []
    for (let i = 0; i < 7; i++) { out.push(new Date(start)); start.setDate(start.getDate() + 1) }
    return out
  }, [anchor])
  const today = new Date()

  return (
    <div className="grid grid-cols-7">
      {days.map((day, i) => {
        const dayActs = activities.filter(a => sameDay(activityDay(a), day)).sort((a, b) => activityDay(a).getTime() - activityDay(b).getTime())
        const isToday = sameDay(day, today)
        return (
          <div key={i} className="min-h-40 border-r last:border-r-0 border-b">
            <button
              onClick={() => onCreate('Meeting', day)}
              className={cn('w-full text-center py-2 border-b hover:bg-accent/40', isToday ? 'bg-primary/10' : '')}
            >
              <div className="text-xs text-muted-foreground uppercase">{day.toLocaleDateString(undefined, { weekday: 'short' })}</div>
              <div className={cn('text-sm font-bold inline-flex items-center justify-center h-7 w-7 rounded-full', isToday ? 'bg-primary text-primary-foreground' : '')}>{day.getDate()}</div>
            </button>
            <div className="flex flex-col gap-1 p-1">
              {dayActs.map(a => <ActivityChip key={a.id} a={a} onClick={() => onEdit(a)} />)}
              {dayActs.length === 0 && <span className="text-xs text-muted-foreground/60 p-1.5">No activities</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DayView({ activities, anchor, onCreate, onEdit }: { activities: any[]; anchor: Date; onCreate: (type: string, date: Date) => void; onEdit: (a: any) => void }) {
  const dayActs = activities
    .filter(a => sameDay(activityDay(a), anchor))
    .sort((a, b) => activityDay(a).getTime() - activityDay(b).getTime())

  return (
    <div className="p-2">
      <button onClick={() => onCreate('Meeting', anchor)} className="w-full text-left px-2 py-2 text-xs text-muted-foreground rounded hover:bg-accent/40">
        + Add on {anchor.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </button>
      {dayActs.length === 0 && <p className="px-2 py-8 text-center text-sm text-muted-foreground">No activities for this day.</p>}
      <div className="space-y-1.5 mt-1">
        {dayActs.map(a => (
          <button key={a.id} onClick={() => onEdit(a)} className="w-full text-left flex items-start gap-2 p-2 rounded hover:bg-accent/40 border">
            <div className={cn('mt-0.5 h-2.5 w-2.5 rounded-full shrink-0', TYPE_COLORS[a.activityType] || TYPE_COLORS.Other)} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{a.subject}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {a.startAt && <span className="flex items-center gap-1"><Clock size={11} />{timeLabel(new Date(a.startAt))}{a.endAt ? ` - ${timeLabel(new Date(a.endAt))}` : ''}</span>}
                {a.dueAt && <span className="flex items-center gap-1"><Clock size={11} />Due {timeLabel(new Date(a.dueAt))}</span>}
                {a.location && <span className="flex items-center gap-1"><MapPin size={11} />{a.location}</span>}
                <span className="flex items-center gap-1">{a.activityType}{a.status ? ` · ${a.status}` : ''}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function ActivityDialog({ open, onOpenChange, editing, preset, onDelete }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: any | null
  preset: { type: string; date: Date } | null
  onDelete: (id: string) => void
}) {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const editingId = editing?.id
  const [form, setForm] = useState<any>(emptyForm(null))

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        subject: editing.subject || '',
        activityType: editing.activityType || 'Task',
        status: editing.status || 'Planned',
        priority: editing.priority || 'Medium',
        location: editing.location || '',
        startAt: editing.startAt ? toLocalInput(new Date(editing.startAt)) : '',
        endAt: editing.endAt ? toLocalInput(new Date(editing.endAt)) : '',
        dueAt: editing.dueAt ? toLocalInput(new Date(editing.dueAt)) : '',
        description: editing.description || '',
      })
    } else {
      setForm(emptyForm(preset))
    }
  }, [open, editing, preset])

  const isTask = form.activityType === 'Task'

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createCalendarActivity(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['activities-upcoming'] })
      addToast({ title: 'Activity created', variant: 'success' })
      onOpenChange(false)
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const updateMutation = useMutation({
    mutationFn: (d: any) => api.updateCalendarActivity(editingId, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['activities-upcoming'] })
      addToast({ title: 'Activity updated', variant: 'success' })
      onOpenChange(false)
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const submit = () => {
    if (!form.subject) { addToast({ title: 'Error', description: 'Subject is required', variant: 'destructive' }); return }
    const payload: any = {
      subject: form.subject,
      activityType: form.activityType,
      status: form.status,
      priority: form.priority,
      description: form.description,
    }
    if (isTask) payload.dueAt = form.dueAt || null
    else {
      payload.startAt = form.startAt || null
      payload.endAt = form.endAt || null
      payload.location = form.location
    }
    if (editingId) updateMutation.mutate(payload)
    else createMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editingId ? 'Edit Activity' : 'New Activity'}</DialogTitle></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); submit() }} className="space-y-3">
          <Input placeholder="Subject" value={form.subject} onChange={e => setForm((f: any) => ({ ...f, subject: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium block mb-1.5">Type</label>
              <Select value={form.activityType} onValueChange={(v) => setForm((f: any) => ({ ...f, activityType: v, status: 'Planned' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Task', 'Call', 'Meeting', 'Other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm((f: any) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(isTask ? TASK_STATUS : EVENT_STATUS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium block mb-1.5">Priority</label>
              <Select value={form.priority} onValueChange={(v) => setForm((f: any) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {isTask ? (
              <div>
                <label className="text-sm font-medium block mb-1.5">Due</label>
                <Input type="datetime-local" value={form.dueAt} onChange={e => setForm((f: any) => ({ ...f, dueAt: e.target.value }))} />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium block mb-1.5">Location</label>
                <Input placeholder="e.g. Meeting room" value={form.location} onChange={e => setForm((f: any) => ({ ...f, location: e.target.value }))} />
              </div>
            )}
          </div>
          {!isTask && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium block mb-1.5">Start</label>
                <Input type="datetime-local" value={form.startAt} onChange={e => setForm((f: any) => ({ ...f, startAt: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">End</label>
                <Input type="datetime-local" value={form.endAt} onChange={e => setForm((f: any) => ({ ...f, endAt: e.target.value }))} />
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium block mb-1.5">Description</label>
            <textarea placeholder="Description" className={`${inputCls} h-20`} value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              {editingId && (
                <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(editingId)}>
                  <Trash2 size={14} className="mr-1.5" /> Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
